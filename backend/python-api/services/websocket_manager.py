from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio
from datetime import datetime

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_subscriptions: Dict[str, List[str]] = {}  # user_id -> [alert_types]
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept WebSocket connection and store it"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"✅ Client {client_id} connected. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        """Remove WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            if client_id in self.user_subscriptions:
                del self.user_subscriptions[client_id]
            print(f"❌ Client {client_id} disconnected. Active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                print(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def send_json_to_client(self, data: dict, client_id: str):
        """Send JSON data to specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(data)
            except Exception as e:
                print(f"Error sending JSON to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast_message(self, message: str):
        """Broadcast message to all connected clients"""
        disconnected_clients = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def broadcast_json(self, data: dict):
        """Broadcast JSON data to all connected clients"""
        disconnected_clients = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"Error broadcasting JSON to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def subscribe_to_alerts(self, client_id: str, alert_types: List[str]):
        """Subscribe client to specific alert types"""
        self.user_subscriptions[client_id] = alert_types
        await self.send_json_to_client({
            "type": "subscription_updated",
            "alert_types": alert_types,
            "timestamp": datetime.now().isoformat()
        }, client_id)
    
    async def send_alert_to_subscribers(self, alert_type: str, alert_data: dict):
        """Send alert to subscribed clients"""
        for client_id, subscriptions in self.user_subscriptions.items():
            if alert_type in subscriptions:
                await self.send_json_to_client({
                    "type": "alert",
                    "alert_type": alert_type,
                    "data": alert_data,
                    "timestamp": datetime.now().isoformat()
                }, client_id)
    
    def get_connection_stats(self):
        """Get current connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "subscribed_users": len(self.user_subscriptions),
            "active_clients": list(self.active_connections.keys())
        }