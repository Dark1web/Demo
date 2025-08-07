import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
import aiohttp
import json

# For SMS (Twilio)
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("⚠️ Twilio not available. Install with: pip install twilio")

# For Telegram Bot
try:
    import telegram
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    print("⚠️ python-telegram-bot not available. Install with: pip install python-telegram-bot")

class NotificationService:
    def __init__(self):
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email_user = os.getenv("EMAIL_USER")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        
        # SMS configuration (Twilio)
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        # Initialize Twilio client
        if TWILIO_AVAILABLE and self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = TwilioClient(self.twilio_account_sid, self.twilio_auth_token)
        else:
            self.twilio_client = None
        
        # Telegram Bot configuration
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if TELEGRAM_AVAILABLE and self.telegram_bot_token:
            self.telegram_bot = telegram.Bot(token=self.telegram_bot_token)
        else:
            self.telegram_bot = None
        
        # Webhook URLs for external services
        self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        self.discord_webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    
    async def send_email_notification(self, to_email: str, subject: str, content: str, is_html: bool = False) -> bool:
        """Send email notification"""
        try:
            if not self.email_user or not self.email_password:
                print("⚠️ Email credentials not configured")
                return False
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            if is_html:
                msg.attach(MIMEText(content, 'html'))
            else:
                msg.attach(MIMEText(content, 'plain'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            server.send_message(msg)
            server.quit()
            
            print(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    async def send_sms_notification(self, to_phone: str, message: str) -> bool:
        """Send SMS notification via Twilio"""
        try:
            if not self.twilio_client:
                print("⚠️ Twilio not configured")
                return False
            
            # Send SMS
            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_phone_number,
                to=to_phone
            )
            
            print(f"✅ SMS sent to {to_phone}: {message_obj.sid}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send SMS: {e}")
            return False
    
    async def send_telegram_notification(self, chat_id: str, message: str) -> bool:
        """Send Telegram notification"""
        try:
            if not self.telegram_bot:
                print("⚠️ Telegram bot not configured")
                return False
            
            await self.telegram_bot.send_message(chat_id=chat_id, text=message)
            print(f"✅ Telegram message sent to {chat_id}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send Telegram message: {e}")
            return False
    
    async def send_webhook_notification(self, webhook_url: str, payload: Dict) -> bool:
        """Send notification via webhook (Slack, Discord, etc.)"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status == 200:
                        print(f"✅ Webhook notification sent successfully")
                        return True
                    else:
                        print(f"❌ Webhook failed with status: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Failed to send webhook notification: {e}")
            return False
    
    async def send_slack_notification(self, message: str, channel: str = None) -> bool:
        """Send Slack notification"""
        if not self.slack_webhook_url:
            print("⚠️ Slack webhook not configured")
            return False
        
        payload = {
            "text": message,
            "username": "Aegis Vision Alert",
            "icon_emoji": ":warning:"
        }
        
        if channel:
            payload["channel"] = channel
        
        return await self.send_webhook_notification(self.slack_webhook_url, payload)
    
    async def send_discord_notification(self, message: str) -> bool:
        """Send Discord notification"""
        if not self.discord_webhook_url:
            print("⚠️ Discord webhook not configured")
            return False
        
        payload = {
            "content": message,
            "username": "Aegis Vision Alert"
        }
        
        return await self.send_webhook_notification(self.discord_webhook_url, payload)
    
    def format_disaster_alert(self, alert_data: Dict) -> Dict[str, str]:
        """Format disaster alert for different channels"""
        alert_type = alert_data.get('type', 'Disaster')
        location = alert_data.get('location', 'Unknown location')
        severity = alert_data.get('severity', 'Unknown')
        message = alert_data.get('message', 'No details provided')
        
        # Email format (HTML)
        email_content = f"""
        <html>
        <body>
            <h2>🚨 {alert_type} Alert - {severity} Level</h2>
            <p><strong>Location:</strong> {location}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Details:</strong> {message}</p>
            <hr>
            <p><em>This is an automated alert from Aegis Vision Disaster Management System.</em></p>
            <p>Stay safe and follow official guidance from local authorities.</p>
        </body>
        </html>
        """
        
        # SMS format (short)
        sms_content = f"🚨 {alert_type} Alert ({severity}): {location}. {message[:100]}... Stay safe!"
        
        # Chat format (Telegram, Slack, Discord)
        chat_content = f"""
🚨 **{alert_type} Alert** - {severity} Level
📍 **Location:** {location}
⏰ **Time:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
📝 **Details:** {message}

Stay safe and follow official guidance!
        """
        
        return {
            "email": email_content,
            "sms": sms_content,
            "chat": chat_content,
            "subject": f"🚨 {alert_type} Alert - {severity} - {location}"
        }
    
    async def send_multi_channel_alert(self, alert_data: Dict, recipients: Dict[str, List[str]]) -> Dict[str, List[bool]]:
        """Send alert via multiple channels"""
        formatted_content = self.format_disaster_alert(alert_data)
        results = {
            "email": [],
            "sms": [],
            "telegram": [],
            "slack": [],
            "discord": []
        }
        
        # Send emails
        if "email" in recipients:
            for email in recipients["email"]:
                result = await self.send_email_notification(
                    email, 
                    formatted_content["subject"], 
                    formatted_content["email"], 
                    is_html=True
                )
                results["email"].append(result)
        
        # Send SMS
        if "sms" in recipients:
            for phone in recipients["sms"]:
                result = await self.send_sms_notification(phone, formatted_content["sms"])
                results["sms"].append(result)
        
        # Send Telegram
        if "telegram" in recipients:
            for chat_id in recipients["telegram"]:
                result = await self.send_telegram_notification(chat_id, formatted_content["chat"])
                results["telegram"].append(result)
        
        # Send Slack
        if "slack" in recipients and recipients["slack"]:
            result = await self.send_slack_notification(formatted_content["chat"])
            results["slack"].append(result)
        
        # Send Discord
        if "discord" in recipients and recipients["discord"]:
            result = await self.send_discord_notification(formatted_content["chat"])
            results["discord"].append(result)
        
        return results
    
    def get_service_status(self) -> Dict[str, bool]:
        """Get status of all notification services"""
        return {
            "email": bool(self.email_user and self.email_password),
            "sms": bool(self.twilio_client),
            "telegram": bool(self.telegram_bot),
            "slack": bool(self.slack_webhook_url),
            "discord": bool(self.discord_webhook_url)
        }

# Global notification service instance
notification_service = NotificationService()