from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from routers import disaster_prediction, misinformation, alerts, reports, auth
from services.websocket_manager import WebSocketManager
from services.supabase_client import get_supabase_client

load_dotenv()

# WebSocket manager for real-time updates
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Aegis Vision Backend API...")
    yield
    # Shutdown
    print("🛑 Shutting down Aegis Vision Backend API...")

app = FastAPI(
    title="Aegis Vision - Disaster Management API",
    description="Real-time disaster data collection, ML prediction, and alert system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(disaster_prediction.router, prefix="/api/predict", tags=["ML Predictions"])
app.include_router(misinformation.router, prefix="/api/misinformation", tags=["Misinformation Detection"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts & Notifications"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports & Analytics"])

@app.get("/")
async def root():
    return {
        "message": "Aegis Vision Disaster Management API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test Supabase connection
        supabase = get_supabase_client()
        response = supabase.table("health_check").select("*").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2024-01-20T10:00:00Z",
            "services": {
                "ml_models": "active",
                "data_pipeline": "active",
                "notifications": "active"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.send_personal_message(f"Echo: {data}", client_id)
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        log_level="info"
    )