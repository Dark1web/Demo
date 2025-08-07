import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_ANON_KEY", "")
    
    if not url or not key or url == "" or key == "":
        # Return a mock client for development
        print("⚠️ Supabase credentials not configured - using mock client")
        return MockSupabaseClient()
    
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"⚠️ Failed to create Supabase client: {e} - using mock client")
        return MockSupabaseClient()

def get_supabase_service_client() -> Client:
    """Get Supabase service client with service role key"""
    url = os.getenv("SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    if not url or not service_key or url == "" or service_key == "":
        # Return a mock client for development
        print("⚠️ Supabase service credentials not configured - using mock client")
        return MockSupabaseClient()
    
    try:
        return create_client(url, service_key)
    except Exception as e:
        print(f"⚠️ Failed to create Supabase service client: {e} - using mock client")
        return MockSupabaseClient()

class MockSupabaseClient:
    """Mock Supabase client for development when credentials are not available"""
    
    def __init__(self):
        self.auth = MockAuth()
        self.table = lambda name: MockTable(name)
    
    def __getattr__(self, name):
        # Return a mock method for any undefined attributes
        return lambda *args, **kwargs: MockResponse()

class MockAuth:
    def get_user(self, token):
        return MockUser()
    
    def sign_up(self, credentials):
        return MockAuthResponse()
    
    def sign_in_with_password(self, credentials):
        return MockAuthResponse()
    
    def sign_out(self):
        return MockResponse()

class MockUser:
    def __init__(self):
        self.id = "mock_user_id"
        self.email = "mock@example.com"
        self.email_confirmed_at = "2024-01-20T00:00:00Z"

class MockAuthResponse:
    def __init__(self):
        self.user = MockUser()
        self.session = MockSession()

class MockSession:
    def __init__(self):
        self.access_token = "mock_access_token"
        self.refresh_token = "mock_refresh_token"
        self.expires_in = 3600

class MockTable:
    def __init__(self, name):
        self.name = name
    
    def select(self, *args):
        return self
    
    def insert(self, data):
        return self
    
    def update(self, data):
        return self
    
    def delete(self):
        return self
    
    def eq(self, column, value):
        return self
    
    def execute(self):
        return MockResponse()

class MockResponse:
    def __init__(self):
        self.data = []
        self.error = None

class SupabaseService:
    def __init__(self):
        self.client = get_supabase_client()
        self.service_client = get_supabase_service_client()
    
    async def create_user_profile(self, user_id: str, email: str, profile_data: dict):
        """Create user profile in profiles table"""
        try:
            # Mock implementation for development
            print(f"✅ Mock: Created user profile for {email}")
            return {"id": user_id, "email": email, **profile_data}
        except Exception as e:
            raise Exception(f"Failed to create user profile: {str(e)}")
    
    async def get_user_preferences(self, user_id: str):
        """Get user alert preferences"""
        try:
            # Mock implementation for development
            return {
                "user_id": user_id,
                "notification_preferences": {
                    "email_notifications": True,
                    "sms_notifications": False,
                    "push_notifications": True
                }
            }
        except Exception as e:
            raise Exception(f"Failed to get user preferences: {str(e)}")
    
    async def update_user_preferences(self, user_id: str, preferences: dict):
        """Update user alert preferences"""
        try:
            # Mock implementation for development
            print(f"✅ Mock: Updated preferences for user {user_id}")
            return {"user_id": user_id, **preferences}
        except Exception as e:
            raise Exception(f"Failed to update user preferences: {str(e)}")
    
    async def log_disaster_event(self, event_data: dict):
        """Log disaster event to database"""
        try:
            # Mock implementation for development
            print(f"✅ Mock: Logged disaster event")
            return event_data
        except Exception as e:
            raise Exception(f"Failed to log disaster event: {str(e)}")
    
    async def store_prediction_result(self, prediction_data: dict):
        """Store ML prediction results"""
        try:
            # Mock implementation for development
            print(f"✅ Mock: Stored prediction result")
            return prediction_data
        except Exception as e:
            raise Exception(f"Failed to store prediction: {str(e)}")