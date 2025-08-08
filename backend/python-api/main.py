from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import jwt
import datetime
import asyncio
import json
from datetime import datetime, timedelta
import uvicorn
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Real-time Dashboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./dashboard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Secret
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class LocationData(Base):
    __tablename__ = "location_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    address = Column(String)

class DashboardData(Base):
    __tablename__ = "dashboard_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    data_type = Column(String)  # 'metrics', 'charts', 'activity'
    data = Column(String)  # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Data classes
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None

class DashboardDataUpdate(BaseModel):
    data_type: str
    data: Dict[str, Any]

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Authentication endpoints
@app.post("/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user (in production, hash the password)
    db_user = User(email=user.email, password_hash=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "id": db_user.id}}

@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or db_user.password_hash != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "id": db_user.id}}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Location tracking endpoints
@app.post("/location/update")
async def update_location(location: LocationUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    location_data = LocationData(
        user_id=current_user.id,
        latitude=location.latitude,
        longitude=location.longitude,
        address=location.address
    )
    db.add(location_data)
    db.commit()
    
    # Broadcast location update to all connected clients
    await manager.broadcast(json.dumps({
        "type": "location_update",
        "user_id": current_user.id,
        "email": current_user.email,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "address": location.address,
        "timestamp": datetime.utcnow().isoformat()
    }))
    
    return {"message": "Location updated successfully"}

@app.get("/location/history")
async def get_location_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    locations = db.query(LocationData).filter(LocationData.user_id == current_user.id).order_by(LocationData.timestamp.desc()).limit(100).all()
    return [
        {
            "id": loc.id,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "address": loc.address,
            "timestamp": loc.timestamp.isoformat()
        }
        for loc in locations
    ]

# Dashboard data endpoints
@app.post("/dashboard/data")
async def update_dashboard_data(data: DashboardDataUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dashboard_data = DashboardData(
        user_id=current_user.id,
        data_type=data.data_type,
        data=json.dumps(data.data)
    )
    db.add(dashboard_data)
    db.commit()
    
    # Broadcast dashboard update
    await manager.broadcast(json.dumps({
        "type": "dashboard_update",
        "user_id": current_user.id,
        "email": current_user.email,
        "data_type": data.data_type,
        "data": data.data,
        "timestamp": datetime.utcnow().isoformat()
    }))
    
    return {"message": "Dashboard data updated successfully"}

@app.get("/dashboard/data/{data_type}")
async def get_dashboard_data(data_type: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = db.query(DashboardData).filter(
        DashboardData.user_id == current_user.id,
        DashboardData.data_type == data_type
    ).order_by(DashboardData.timestamp.desc()).limit(50).all()
    
    return [
        {
            "id": item.id,
            "data_type": item.data_type,
            "data": json.loads(item.data),
            "timestamp": item.timestamp.isoformat()
        }
        for item in data
    ]

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            await manager.send_personal_message(f"Message received: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}