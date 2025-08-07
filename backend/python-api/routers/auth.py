from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
import os
from datetime import datetime, timedelta

from services.supabase_client import SupabaseService

router = APIRouter()
security = HTTPBearer()
supabase_service = SupabaseService()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    alert_preferences: Optional[dict] = {}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and get current user"""
    try:
        token = credentials.credentials
        # Verify with Supabase JWT
        response = supabase_service.client.auth.get_user(token)
        if response.user:
            return response.user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register new user with Supabase Auth"""
    try:
        # Register with Supabase Auth
        response = supabase_service.client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if response.user:
            # Create user profile
            profile_data = {
                "full_name": user_data.full_name,
                "phone": user_data.phone,
                "alert_preferences": {
                    "flood_alerts": True,
                    "heatwave_alerts": True,
                    "misinformation_alerts": False,
                    "sms_notifications": False,
                    "email_notifications": True
                }
            }
            
            await supabase_service.create_user_profile(
                response.user.id,
                user_data.email,
                profile_data
            )
            
            return {
                "message": "User registered successfully",
                "user_id": response.user.id,
                "email": user_data.email,
                "requires_verification": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration error: {str(e)}"
        )

@router.post("/login")
async def login_user(user_credentials: UserLogin):
    """Login user with Supabase Auth"""
    try:
        response = supabase_service.client.auth.sign_in_with_password({
            "email": user_credentials.email,
            "password": user_credentials.password
        })
        
        if response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout")
async def logout_user(current_user = Depends(get_current_user)):
    """Logout current user"""
    try:
        supabase_service.client.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    try:
        preferences = await supabase_service.get_user_preferences(current_user.id)
        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "profile": preferences
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get profile: {str(e)}"
        )

@router.put("/profile")
async def update_user_profile(
    profile_data: UserProfile,
    current_user = Depends(get_current_user)
):
    """Update user profile and preferences"""
    try:
        updated_profile = await supabase_service.update_user_preferences(
            current_user.id,
            profile_data.dict(exclude_unset=True)
        )
        return {
            "message": "Profile updated successfully",
            "profile": updated_profile
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    try:
        response = supabase_service.client.auth.refresh_session(refresh_token)
        if response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )