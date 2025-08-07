from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from datetime import datetime

from models.flood_prediction import flood_predictor
from routers.auth import get_current_user
from services.supabase_client import SupabaseService

router = APIRouter()
supabase_service = SupabaseService()

class FloodPredictionInput(BaseModel):
    # Weather data
    rainfall_24h: float = Field(default=0, description="24-hour rainfall in mm", ge=0, le=500)
    rainfall_7d: float = Field(default=0, description="7-day rainfall in mm", ge=0, le=2000)
    soil_moisture: float = Field(default=50, description="Soil moisture percentage", ge=0, le=100)
    river_level: float = Field(default=0, description="River level above normal in meters", ge=-10, le=20)
    
    # Geographic data
    elevation: float = Field(default=100, description="Elevation in meters", ge=0, le=5000)
    slope: float = Field(default=5, description="Terrain slope in degrees", ge=0, le=90)
    drainage_density: float = Field(default=1, description="Drainage density in km/km²", ge=0, le=10)
    land_use_urban: float = Field(default=0.3, description="Urban land use percentage", ge=0, le=1)
    
    # Demographic data
    population_density: float = Field(default=1000, description="Population density per km²", ge=0, le=50000)
    historical_floods: int = Field(default=0, description="Historical floods in past 10 years", ge=0, le=50)
    
    # Location context
    location_name: Optional[str] = Field(default=None, description="Location name for reference")
    latitude: Optional[float] = Field(default=None, description="Latitude coordinate")
    longitude: Optional[float] = Field(default=None, description="Longitude coordinate")

class HeatwaveInput(BaseModel):
    temperature: float = Field(description="Current temperature in Celsius", ge=-50, le=60)
    humidity: float = Field(description="Relative humidity percentage", ge=0, le=100)
    wind_speed: float = Field(default=10, description="Wind speed in km/h", ge=0, le=200)
    population_elderly: float = Field(default=0.15, description="Percentage of elderly population", ge=0, le=1)
    urban_heat_island: float = Field(default=2, description="Urban heat island effect in °C", ge=0, le=10)
    air_quality_index: int = Field(default=50, description="Air Quality Index", ge=0, le=500)
    
    location_name: Optional[str] = Field(default=None, description="Location name")
    latitude: Optional[float] = Field(default=None, description="Latitude coordinate")
    longitude: Optional[float] = Field(default=None, description="Longitude coordinate")

@router.post("/flood")
async def predict_flood_risk(
    input_data: FloodPredictionInput,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Predict flood risk based on environmental and geographic factors"""
    try:
        # Convert to dict for model
        prediction_input = input_data.dict()
        
        # Get prediction
        result = flood_predictor.predict_flood_risk(prediction_input)
        
        # Add user and location context
        result["user_id"] = current_user.id
        result["input_data"] = prediction_input
        
        # Store prediction in background
        background_tasks.add_task(
            store_prediction_result,
            current_user.id,
            "flood",
            prediction_input,
            result
        )
        
        return {
            "status": "success",
            "prediction": result,
            "message": "Flood risk assessment completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/heatwave")
async def predict_heatwave_risk(
    input_data: HeatwaveInput,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Predict heatwave risk and health impact"""
    try:
        # Calculate heat index
        temp_c = input_data.temperature
        humidity = input_data.humidity
        
        # Convert to Fahrenheit for heat index calculation
        temp_f = (temp_c * 9/5) + 32
        
        # Simplified heat index calculation
        if temp_f >= 80 and humidity >= 40:
            heat_index_f = (
                -42.379 + 2.04901523 * temp_f + 10.14333127 * humidity -
                0.22475541 * temp_f * humidity - 6.83783e-3 * temp_f**2 -
                5.481717e-2 * humidity**2 + 1.22874e-3 * temp_f**2 * humidity +
                8.5282e-4 * temp_f * humidity**2 - 1.99e-6 * temp_f**2 * humidity**2
            )
        else:
            heat_index_f = temp_f
        
        heat_index_c = (heat_index_f - 32) * 5/9
        
        # Risk assessment
        base_risk = max(0, heat_index_c - 30) * 3  # Risk increases after 30°C
        
        # Adjust for factors
        wind_factor = max(0.5, 1 - (input_data.wind_speed / 50))  # Wind reduces risk
        humidity_factor = 1 + (humidity - 50) / 100  # High humidity increases risk
        elderly_factor = 1 + input_data.population_elderly * 2  # Elderly population at higher risk
        uhi_factor = 1 + input_data.urban_heat_island / 10  # Urban heat island effect
        aqi_factor = 1 + max(0, input_data.air_quality_index - 100) / 200  # Poor air quality
        
        final_risk = base_risk * wind_factor * humidity_factor * elderly_factor * uhi_factor * aqi_factor
        final_risk = min(100, final_risk)
        
        # Risk level classification
        if final_risk < 25:
            risk_level = "Low"
            risk_color = "green"
        elif final_risk < 50:
            risk_level = "Moderate"
            risk_color = "yellow"
        elif final_risk < 75:
            risk_level = "High"
            risk_color = "orange"
        else:
            risk_level = "Critical"
            risk_color = "red"
        
        # Generate recommendations
        recommendations = []
        if final_risk > 60:
            recommendations.extend([
                "🌡️ HEAT WARNING: Avoid outdoor activities during peak hours",
                "💧 Stay hydrated - drink water frequently",
                "🏠 Seek air-conditioned spaces when possible"
            ])
        
        if input_data.population_elderly > 0.2:
            recommendations.append("👥 Check on elderly neighbors and relatives")
        
        if input_data.air_quality_index > 100:
            recommendations.append("😷 Consider wearing masks due to poor air quality")
        
        if not recommendations:
            recommendations.append("✅ Heat levels are currently manageable")
        
        result = {
            "risk_score": float(final_risk),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "heat_index": {
                "celsius": float(heat_index_c),
                "fahrenheit": float(heat_index_f)
            },
            "factors": {
                "base_risk": float(base_risk),
                "wind_factor": float(wind_factor),
                "humidity_factor": float(humidity_factor),
                "elderly_factor": float(elderly_factor),
                "urban_heat_factor": float(uhi_factor),
                "air_quality_factor": float(aqi_factor)
            },
            "recommendations": recommendations,
            "prediction_timestamp": datetime.now().isoformat()
        }
        
        # Store prediction in background
        background_tasks.add_task(
            store_prediction_result,
            current_user.id,
            "heatwave",
            input_data.dict(),
            result
        )
        
        return {
            "status": "success",
            "prediction": result,
            "message": "Heatwave risk assessment completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heatwave prediction failed: {str(e)}")

@router.get("/history")
async def get_prediction_history(
    prediction_type: Optional[str] = None,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get user's prediction history"""
    try:
        # This would query the database for user's prediction history
        # For now, returning mock data
        
        history = {
            "user_id": current_user.id,
            "total_predictions": 25,
            "predictions": [
                {
                    "id": "pred_001",
                    "type": "flood",
                    "risk_score": 75,
                    "risk_level": "High",
                    "location": "Downtown Area",
                    "created_at": "2024-01-20T10:30:00Z"
                },
                {
                    "id": "pred_002", 
                    "type": "heatwave",
                    "risk_score": 45,
                    "risk_level": "Moderate",
                    "location": "Suburban District",
                    "created_at": "2024-01-19T14:15:00Z"
                }
            ]
        }
        
        return {
            "status": "success",
            "data": history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@router.get("/model-info")
async def get_model_info():
    """Get information about the ML models"""
    return {
        "models": {
            "flood_prediction": {
                "algorithm": "Random Forest + Gradient Boosting",
                "features": flood_predictor.feature_names,
                "accuracy": "~85% (synthetic data)",
                "last_trained": "2024-01-20T00:00:00Z",
                "version": "1.0"
            },
            "heatwave_prediction": {
                "algorithm": "Heat Index + Risk Factors",
                "features": ["temperature", "humidity", "wind_speed", "demographics"],
                "accuracy": "~80% (rule-based)",
                "version": "1.0"
            }
        },
        "status": "active",
        "last_updated": datetime.now().isoformat()
    }

async def store_prediction_result(user_id: str, prediction_type: str, input_data: dict, result: dict):
    """Background task to store prediction results"""
    try:
        prediction_data = {
            "user_id": user_id,
            "prediction_type": prediction_type,
            "input_data": input_data,
            "result": result,
            "risk_score": result.get("risk_score", 0),
            "risk_level": result.get("risk_level", "Unknown")
        }
        
        await supabase_service.store_prediction_result(prediction_data)
        print(f"✅ Stored {prediction_type} prediction for user {user_id}")
        
    except Exception as e:
        print(f"❌ Failed to store prediction: {e}")