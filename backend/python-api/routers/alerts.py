from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field, EmailStr
from typing import Dict, List, Optional, Union
from datetime import datetime, timedelta
from enum import Enum

from routers.auth import get_current_user
from services.notification_service import notification_service
from services.supabase_client import SupabaseService
from services.websocket_manager import WebSocketManager

router = APIRouter()
supabase_service = SupabaseService()

class AlertType(str, Enum):
    FLOOD = "flood"
    HEATWAVE = "heatwave"
    EARTHQUAKE = "earthquake"
    WILDFIRE = "wildfire"
    STORM = "storm"
    MISINFORMATION = "misinformation"
    SYSTEM = "system"

class AlertSeverity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    TELEGRAM = "telegram"
    SLACK = "slack"
    DISCORD = "discord"
    WEBSOCKET = "websocket"

class AlertCreate(BaseModel):
    type: AlertType
    severity: AlertSeverity
    title: str = Field(max_length=200)
    message: str = Field(max_length=2000)
    location: Optional[str] = Field(default=None, max_length=200)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    expires_at: Optional[datetime] = None
    metadata: Optional[Dict] = {}

class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = False
    push_notifications: bool = True
    notification_channels: List[NotificationChannel] = [NotificationChannel.EMAIL]
    alert_types: List[AlertType] = list(AlertType)
    min_severity: AlertSeverity = AlertSeverity.MODERATE
    quiet_hours_start: Optional[str] = Field(default=None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: Optional[str] = Field(default=None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")

class UserContactInfo(BaseModel):
    phone_number: Optional[str] = Field(default=None, pattern=r"^\+?[1-9]\d{1,14}$")
    telegram_chat_id: Optional[str] = None
    slack_user_id: Optional[str] = None

@router.post("/create")
async def create_alert(
    alert_data: AlertCreate,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Create and broadcast a new alert"""
    try:
        # Create alert record
        alert_record = {
            "id": f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "type": alert_data.type.value,
            "severity": alert_data.severity.value,
            "title": alert_data.title,
            "message": alert_data.message,
            "location": alert_data.location,
            "latitude": alert_data.latitude,
            "longitude": alert_data.longitude,
            "created_by": current_user.id,
            "created_at": datetime.now().isoformat(),
            "expires_at": alert_data.expires_at.isoformat() if alert_data.expires_at else None,
            "metadata": alert_data.metadata,
            "status": "active"
        }
        
        # Store alert in database (background task)
        background_tasks.add_task(store_alert, alert_record)
        
        # Broadcast alert (background task)
        background_tasks.add_task(broadcast_alert, alert_record)
        
        return {
            "status": "success",
            "alert_id": alert_record["id"],
            "message": "Alert created and broadcasting initiated",
            "alert": alert_record
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")

@router.get("/active")
async def get_active_alerts(
    alert_type: Optional[AlertType] = None,
    severity: Optional[AlertSeverity] = None,
    location: Optional[str] = None,
    limit: int = 50
):
    """Get currently active alerts"""
    try:
        # Mock active alerts (in real implementation, query from database)
        alerts = [
            {
                "id": "alert_20240120_103000",
                "type": "flood",
                "severity": "high",
                "title": "Flash Flood Warning",
                "message": "Heavy rainfall causing flash flooding in downtown area. Avoid low-lying roads.",
                "location": "Downtown District",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "created_at": "2024-01-20T10:30:00Z",
                "expires_at": "2024-01-20T18:00:00Z",
                "status": "active"
            },
            {
                "id": "alert_20240120_144500",
                "type": "heatwave",
                "severity": "moderate",
                "title": "Heat Advisory",
                "message": "Temperatures expected to reach 35°C. Stay hydrated and limit outdoor activities.",
                "location": "Suburban Areas",
                "latitude": 40.7580,
                "longitude": -73.9855,
                "created_at": "2024-01-20T14:45:00Z",
                "expires_at": "2024-01-21T20:00:00Z",
                "status": "active"
            }
        ]
        
        # Apply filters
        if alert_type:
            alerts = [a for a in alerts if a["type"] == alert_type.value]
        if severity:
            alerts = [a for a in alerts if a["severity"] == severity.value]
        if location:
            alerts = [a for a in alerts if location.lower() in a["location"].lower()]
        
        return {
            "status": "success",
            "count": len(alerts),
            "alerts": alerts[:limit]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")

@router.get("/history")
async def get_alert_history(
    days: int = 7,
    alert_type: Optional[AlertType] = None,
    severity: Optional[AlertSeverity] = None,
    current_user = Depends(get_current_user)
):
    """Get alert history for user"""
    try:
        # Mock alert history
        history = {
            "user_id": current_user.id,
            "period_days": days,
            "total_alerts": 15,
            "alerts_by_type": {
                "flood": 6,
                "heatwave": 4,
                "misinformation": 3,
                "storm": 2
            },
            "alerts_by_severity": {
                "low": 3,
                "moderate": 7,
                "high": 4,
                "critical": 1
            },
            "recent_alerts": [
                {
                    "id": "alert_20240119_090000",
                    "type": "misinformation",
                    "severity": "high",
                    "title": "False Evacuation Order Detected",
                    "received_at": "2024-01-19T09:00:00Z",
                    "action_taken": "reported"
                }
            ]
        }
        
        return {
            "status": "success",
            "data": history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alert history: {str(e)}")

@router.post("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user = Depends(get_current_user)
):
    """Update user notification preferences"""
    try:
        # Update preferences in database
        await supabase_service.update_user_preferences(
            current_user.id,
            {
                "notification_preferences": preferences.dict(),
                "updated_at": datetime.now().isoformat()
            }
        )
        
        return {
            "status": "success",
            "message": "Notification preferences updated",
            "preferences": preferences.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")

@router.get("/preferences")
async def get_notification_preferences(current_user = Depends(get_current_user)):
    """Get user notification preferences"""
    try:
        user_prefs = await supabase_service.get_user_preferences(current_user.id)
        
        if user_prefs and "notification_preferences" in user_prefs:
            return {
                "status": "success",
                "preferences": user_prefs["notification_preferences"]
            }
        else:
            # Return default preferences
            default_prefs = NotificationPreferences()
            return {
                "status": "success",
                "preferences": default_prefs.dict(),
                "is_default": True
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")

@router.post("/contact-info")
async def update_contact_info(
    contact_info: UserContactInfo,
    current_user = Depends(get_current_user)
):
    """Update user contact information for notifications"""
    try:
        await supabase_service.update_user_preferences(
            current_user.id,
            {
                "contact_info": contact_info.dict(exclude_unset=True),
                "updated_at": datetime.now().isoformat()
            }
        )
        
        return {
            "status": "success",
            "message": "Contact information updated",
            "contact_info": contact_info.dict(exclude_unset=True)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update contact info: {str(e)}")

@router.post("/test-notification")
async def send_test_notification(
    channel: NotificationChannel,
    current_user = Depends(get_current_user)
):
    """Send a test notification to verify channel configuration"""
    try:
        test_alert = {
            "type": "system",
            "severity": "low",
            "title": "Test Notification",
            "message": "This is a test notification from Aegis Vision. Your notification channel is working correctly!",
            "location": "System Test",
            "timestamp": datetime.now().isoformat()
        }
        
        # Get user contact info
        user_prefs = await supabase_service.get_user_preferences(current_user.id)
        contact_info = user_prefs.get("contact_info", {}) if user_prefs else {}
        
        success = False
        
        if channel == NotificationChannel.EMAIL:
            success = await notification_service.send_email_notification(
                current_user.email,
                "🧪 Aegis Vision Test Notification",
                f"Test notification sent at {datetime.now()}"
            )
        elif channel == NotificationChannel.SMS:
            phone = contact_info.get("phone_number")
            if phone:
                success = await notification_service.send_sms_notification(
                    phone, 
                    "🧪 Aegis Vision test SMS. Your SMS notifications are working!"
                )
            else:
                raise HTTPException(status_code=400, detail="Phone number not configured")
        elif channel == NotificationChannel.TELEGRAM:
            chat_id = contact_info.get("telegram_chat_id")
            if chat_id:
                success = await notification_service.send_telegram_notification(
                    chat_id,
                    "🧪 Aegis Vision test message. Your Telegram notifications are working!"
                )
            else:
                raise HTTPException(status_code=400, detail="Telegram chat ID not configured")
        
        return {
            "status": "success" if success else "failed",
            "message": f"Test notification {'sent successfully' if success else 'failed'} via {channel.value}",
            "channel": channel.value,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test notification failed: {str(e)}")

@router.get("/service-status")
async def get_notification_service_status():
    """Get status of all notification services"""
    try:
        service_status = notification_service.get_service_status()
        
        return {
            "status": "success",
            "services": service_status,
            "overall_health": "healthy" if any(service_status.values()) else "degraded",
            "checked_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get service status: {str(e)}")

async def store_alert(alert_record: Dict):
    """Background task to store alert in database"""
    try:
        await supabase_service.log_disaster_event({
            "event_type": "alert_created",
            "alert_data": alert_record
        })
        print(f"✅ Stored alert: {alert_record['id']}")
        
    except Exception as e:
        print(f"❌ Failed to store alert: {e}")

async def broadcast_alert(alert_record: Dict):
    """Background task to broadcast alert to subscribed users"""
    try:
        # Mock: In real implementation, query database for users subscribed to this alert type/location
        
        # Example broadcast via WebSocket (if WebSocket manager available)
        websocket_manager = WebSocketManager()
        await websocket_manager.send_alert_to_subscribers(
            alert_record["type"],
            {
                "alert_id": alert_record["id"],
                "title": alert_record["title"],
                "message": alert_record["message"],
                "severity": alert_record["severity"],
                "location": alert_record["location"]
            }
        )
        
        # Example multi-channel notification
        recipients = {
            "email": ["user@example.com"],  # Would come from database
            "sms": ["+1234567890"],
            "telegram": ["12345678"]
        }
        
        await notification_service.send_multi_channel_alert(alert_record, recipients)
        
        print(f"✅ Broadcasted alert: {alert_record['id']}")
        
    except Exception as e:
        print(f"❌ Failed to broadcast alert: {e}")