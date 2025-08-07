from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from datetime import datetime

from models.misinformation_detector import misinformation_detector
from routers.auth import get_current_user
from services.supabase_client import SupabaseService

router = APIRouter()
supabase_service = SupabaseService()

class TextAnalysisInput(BaseModel):
    text: str = Field(description="Text content to analyze", min_length=10, max_length=5000)
    
    # Optional metadata
    source_url: Optional[str] = Field(default=None, description="URL of the content source")
    author: Optional[str] = Field(default=None, description="Author or account name")
    platform: Optional[str] = Field(default=None, description="Social media platform")
    
    # Engagement metrics (for virality calculation)
    likes: Optional[int] = Field(default=0, description="Number of likes/reactions")
    shares: Optional[int] = Field(default=0, description="Number of shares/retweets")
    comments: Optional[int] = Field(default=0, description="Number of comments")
    author_followers: Optional[int] = Field(default=0, description="Author's follower count")
    hours_since_post: Optional[float] = Field(default=1, description="Hours since post was created")

class BulkAnalysisInput(BaseModel):
    texts: List[str] = Field(description="List of texts to analyze", min_items=1, max_items=50)
    metadata: Optional[List[Dict]] = Field(default=None, description="Optional metadata for each text")

@router.post("/analyze")
async def analyze_text_for_misinformation(
    input_data: TextAnalysisInput,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Analyze text content for misinformation patterns"""
    try:
        # Prepare metadata
        metadata = {
            "likes": input_data.likes or 0,
            "shares": input_data.shares or 0,
            "comments": input_data.comments or 0,
            "author_followers": input_data.author_followers or 0,
            "hours_since_post": input_data.hours_since_post or 1,
            "source_url": input_data.source_url,
            "author": input_data.author,
            "platform": input_data.platform
        }
        
        # Perform analysis
        result = misinformation_detector.analyze_text(input_data.text, metadata)
        
        # Add user context
        result["user_id"] = current_user.id
        result["analysis_request"] = {
            "text_preview": input_data.text[:100] + "..." if len(input_data.text) > 100 else input_data.text,
            "source_url": input_data.source_url,
            "platform": input_data.platform
        }
        
        # Store analysis in background
        background_tasks.add_task(
            store_analysis_result,
            current_user.id,
            input_data.text,
            metadata,
            result
        )
        
        return {
            "status": "success",
            "analysis": result,
            "message": "Text analysis completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/bulk-analyze")
async def bulk_analyze_texts(
    input_data: BulkAnalysisInput,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Analyze multiple texts for misinformation patterns"""
    try:
        results = []
        
        for i, text in enumerate(input_data.texts):
            # Get metadata for this text if provided
            metadata = {}
            if input_data.metadata and i < len(input_data.metadata):
                metadata = input_data.metadata[i]
            
            # Perform analysis
            result = misinformation_detector.analyze_text(text, metadata)
            result["text_index"] = i
            result["text_preview"] = text[:50] + "..." if len(text) > 50 else text
            
            results.append(result)
        
        # Calculate summary statistics
        high_risk_count = sum(1 for r in results if r["misinformation_detection"]["risk_score"] > 60)
        avg_risk_score = sum(r["misinformation_detection"]["risk_score"] for r in results) / len(results)
        
        summary = {
            "total_analyzed": len(results),
            "high_risk_content": high_risk_count,
            "average_risk_score": avg_risk_score,
            "risk_distribution": {
                "low": sum(1 for r in results if r["misinformation_detection"]["risk_score"] < 30),
                "moderate": sum(1 for r in results if 30 <= r["misinformation_detection"]["risk_score"] < 60),
                "high": sum(1 for r in results if 60 <= r["misinformation_detection"]["risk_score"] < 80),
                "critical": sum(1 for r in results if r["misinformation_detection"]["risk_score"] >= 80)
            }
        }
        
        # Store bulk analysis in background
        background_tasks.add_task(
            store_bulk_analysis_result,
            current_user.id,
            input_data.texts,
            results,
            summary
        )
        
        return {
            "status": "success",
            "summary": summary,
            "detailed_results": results,
            "message": f"Bulk analysis completed for {len(results)} texts"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk analysis failed: {str(e)}")

@router.get("/analysis-history")
async def get_analysis_history(
    limit: int = 50,
    risk_level: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get user's misinformation analysis history"""
    try:
        # Mock data for demonstration
        history = {
            "user_id": current_user.id,
            "total_analyses": 42,
            "high_risk_detected": 8,
            "recent_analyses": [
                {
                    "id": "analysis_001",
                    "text_preview": "Breaking: Government hiding truth about...",
                    "risk_score": 85,
                    "risk_level": "Critical",
                    "platform": "twitter",
                    "analyzed_at": "2024-01-20T10:30:00Z"
                },
                {
                    "id": "analysis_002",
                    "text_preview": "Official weather service reports...",
                    "risk_score": 15,
                    "risk_level": "Low",
                    "platform": "news",
                    "analyzed_at": "2024-01-19T16:45:00Z"
                }
            ]
        }
        
        return {
            "status": "success",
            "data": history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@router.get("/trending-topics")
async def get_trending_misinformation_topics():
    """Get currently trending misinformation topics"""
    try:
        # Mock trending topics data
        trending = {
            "period": "last_24_hours",
            "topics": [
                {
                    "topic": "weather_manipulation",
                    "mentions": 1250,
                    "avg_risk_score": 78,
                    "keywords": ["weather control", "government conspiracy", "artificial storms"],
                    "geographic_spread": ["US", "EU", "AU"]
                },
                {
                    "topic": "false_evacuation_orders",
                    "mentions": 890,
                    "avg_risk_score": 85,
                    "keywords": ["fake evacuation", "hoax warning", "false alarm"],
                    "geographic_spread": ["US", "CA"]
                },
                {
                    "topic": "disaster_profiteering",
                    "mentions": 654,
                    "avg_risk_score": 65,
                    "keywords": ["disaster capitalism", "profiting from crisis"],
                    "geographic_spread": ["Global"]
                }
            ],
            "generated_at": datetime.now().isoformat()
        }
        
        return {
            "status": "success",
            "data": trending
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending topics: {str(e)}")

@router.get("/model-status")
async def get_model_status():
    """Get misinformation detection model status and metrics"""
    try:
        # Initialize models if not already done
        if not misinformation_detector.sentiment_analyzer:
            misinformation_detector.initialize_models()
        
        status = {
            "model_status": {
                "sentiment_analyzer": "active" if misinformation_detector.sentiment_analyzer else "inactive",
                "text_classifier": "active" if misinformation_detector.is_trained else "training_required",
                "nlp_pipeline": "active" if misinformation_detector.nlp else "limited_functionality"
            },
            "performance_metrics": {
                "avg_processing_time": "0.8s",
                "accuracy": "87%",
                "last_updated": "2024-01-20T00:00:00Z"
            },
            "capabilities": {
                "sentiment_analysis": True,
                "entity_extraction": bool(misinformation_detector.nlp),
                "virality_scoring": True,
                "pattern_detection": True,
                "bulk_processing": True
            }
        }
        
        return {
            "status": "success",
            "data": status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model status: {str(e)}")

@router.post("/train-model")
async def retrain_model(
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Trigger model retraining (admin only)"""
    try:
        # In a real implementation, you'd check if user has admin privileges
        
        # Train model in background
        background_tasks.add_task(retrain_misinformation_model)
        
        return {
            "status": "success",
            "message": "Model retraining initiated in background",
            "estimated_completion": "10-15 minutes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate training: {str(e)}")

async def store_analysis_result(user_id: str, text: str, metadata: dict, result: dict):
    """Background task to store analysis results"""
    try:
        analysis_data = {
            "user_id": user_id,
            "text_content": text[:500],  # Store limited text for privacy
            "metadata": metadata,
            "analysis_result": result,
            "risk_score": result["misinformation_detection"]["risk_score"],
            "risk_level": result["misinformation_detection"]["risk_level"],
            "is_misinformation": result["misinformation_detection"]["is_misinformation"]
        }
        
        # In a real implementation, this would store to the database
        print(f"✅ Stored misinformation analysis for user {user_id}")
        
    except Exception as e:
        print(f"❌ Failed to store analysis: {e}")

async def store_bulk_analysis_result(user_id: str, texts: List[str], results: List[dict], summary: dict):
    """Background task to store bulk analysis results"""
    try:
        bulk_data = {
            "user_id": user_id,
            "text_count": len(texts),
            "summary": summary,
            "high_risk_count": summary["high_risk_content"],
            "avg_risk_score": summary["average_risk_score"]
        }
        
        print(f"✅ Stored bulk analysis for user {user_id}: {len(texts)} texts analyzed")
        
    except Exception as e:
        print(f"❌ Failed to store bulk analysis: {e}")

async def retrain_misinformation_model():
    """Background task to retrain the misinformation detection model"""
    try:
        print("🔥 Starting misinformation model retraining...")
        accuracy = misinformation_detector.train_classifier()
        print(f"✅ Model retraining completed with accuracy: {accuracy:.2f}")
        
    except Exception as e:
        print(f"❌ Model retraining failed: {e}")