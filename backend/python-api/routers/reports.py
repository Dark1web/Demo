from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union
from datetime import datetime, timedelta
from enum import Enum
import io
import base64
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
import tempfile
import os

from routers.auth import get_current_user
from services.supabase_client import SupabaseService

router = APIRouter()
supabase_service = SupabaseService()

class ReportType(str, Enum):
    DISASTER_SUMMARY = "disaster_summary"
    RISK_ASSESSMENT = "risk_assessment"
    MISINFORMATION_ANALYSIS = "misinformation_analysis"
    USER_ACTIVITY = "user_activity"
    SYSTEM_PERFORMANCE = "system_performance"

class ReportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"

class ReportRequest(BaseModel):
    report_type: ReportType
    format: ReportFormat = ReportFormat.PDF
    start_date: datetime = Field(default_factory=lambda: datetime.now() - timedelta(days=30))
    end_date: datetime = Field(default_factory=datetime.now)
    location_filter: Optional[str] = None
    include_charts: bool = True
    include_raw_data: bool = False

class DashboardMetrics(BaseModel):
    total_alerts: int
    active_alerts: int
    high_risk_predictions: int
    misinformation_detected: int
    users_notified: int

@router.post("/generate")
async def generate_report(
    report_request: ReportRequest,
    current_user = Depends(get_current_user)
):
    """Generate and return a comprehensive report"""
    try:
        # Generate report data based on type
        if report_request.report_type == ReportType.DISASTER_SUMMARY:
            report_data = await generate_disaster_summary_data(
                report_request.start_date,
                report_request.end_date,
                report_request.location_filter
            )
        elif report_request.report_type == ReportType.RISK_ASSESSMENT:
            report_data = await generate_risk_assessment_data(
                report_request.start_date,
                report_request.end_date,
                report_request.location_filter
            )
        elif report_request.report_type == ReportType.MISINFORMATION_ANALYSIS:
            report_data = await generate_misinformation_analysis_data(
                report_request.start_date,
                report_request.end_date
            )
        else:
            report_data = await generate_default_report_data()
        
        # Generate report in requested format
        if report_request.format == ReportFormat.PDF:
            file_path = await generate_pdf_report(
                report_data,
                report_request.report_type,
                current_user.id,
                report_request.include_charts
            )
            return FileResponse(
                file_path,
                media_type="application/pdf",
                filename=f"aegis_report_{report_request.report_type.value}_{datetime.now().strftime('%Y%m%d')}.pdf"
            )
        
        elif report_request.format == ReportFormat.CSV:
            csv_data = await generate_csv_report(report_data)
            return Response(
                content=csv_data,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=aegis_report_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
        
        elif report_request.format == ReportFormat.JSON:
            return {
                "status": "success",
                "report_type": report_request.report_type.value,
                "generated_at": datetime.now().isoformat(),
                "data": report_data
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Format {report_request.format} not yet implemented")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.get("/dashboard-metrics")
async def get_dashboard_metrics(
    timeframe: str = "24h",
    current_user = Depends(get_current_user)
):
    """Get real-time dashboard metrics"""
    try:
        # Mock dashboard metrics (in real implementation, query from database)
        if timeframe == "24h":
            metrics = DashboardMetrics(
                total_alerts=42,
                active_alerts=8,
                high_risk_predictions=15,
                misinformation_detected=23,
                users_notified=156
            )
        elif timeframe == "7d":
            metrics = DashboardMetrics(
                total_alerts=289,
                active_alerts=8,
                high_risk_predictions=94,
                misinformation_detected=167,
                users_notified=1243
            )
        else:  # 30d
            metrics = DashboardMetrics(
                total_alerts=1247,
                active_alerts=8,
                high_risk_predictions=412,
                misinformation_detected=698,
                users_notified=5621
            )
        
        # Additional metrics
        trend_data = {
            "alerts_trend": [5, 8, 12, 7, 15, 9, 11],  # Last 7 days
            "prediction_accuracy": 87.5,
            "response_time_avg": "2.3s",
            "user_engagement": 76.8
        }
        
        return {
            "status": "success",
            "timeframe": timeframe,
            "metrics": metrics.dict(),
            "trends": trend_data,
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

@router.get("/analytics")
async def get_analytics_data(
    metric_type: str = "alerts",
    period: str = "7d",
    current_user = Depends(get_current_user)
):
    """Get analytics data for charts and visualizations"""
    try:
        if metric_type == "alerts":
            # Mock alert analytics
            data = {
                "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "datasets": [
                    {
                        "label": "Flood Alerts",
                        "data": [3, 5, 2, 8, 4, 6, 3],
                        "backgroundColor": "rgba(54, 162, 235, 0.5)"
                    },
                    {
                        "label": "Heatwave Alerts", 
                        "data": [2, 3, 4, 1, 6, 2, 4],
                        "backgroundColor": "rgba(255, 99, 132, 0.5)"
                    }
                ]
            }
        
        elif metric_type == "predictions":
            data = {
                "labels": ["Very Low", "Low", "Moderate", "High", "Critical"],
                "datasets": [
                    {
                        "label": "Risk Distribution",
                        "data": [15, 25, 35, 20, 5],
                        "backgroundColor": [
                            "rgba(75, 192, 192, 0.5)",
                            "rgba(54, 162, 235, 0.5)",
                            "rgba(255, 206, 86, 0.5)",
                            "rgba(255, 99, 132, 0.5)",
                            "rgba(153, 102, 255, 0.5)"
                        ]
                    }
                ]
            }
        
        elif metric_type == "misinformation":
            data = {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                "datasets": [
                    {
                        "label": "Detected",
                        "data": [45, 52, 38, 67, 43, 59],
                        "borderColor": "rgba(255, 99, 132, 1)",
                        "backgroundColor": "rgba(255, 99, 132, 0.2)"
                    },
                    {
                        "label": "Verified",
                        "data": [38, 48, 32, 58, 37, 51],
                        "borderColor": "rgba(54, 162, 235, 1)",
                        "backgroundColor": "rgba(54, 162, 235, 0.2)"
                    }
                ]
            }
        
        else:
            data = {"labels": [], "datasets": []}
        
        return {
            "status": "success",
            "metric_type": metric_type,
            "period": period,
            "data": data,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.get("/export-data")
async def export_raw_data(
    data_type: str = "alerts",
    format: ReportFormat = ReportFormat.CSV,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user)
):
    """Export raw data in various formats"""
    try:
        # Set default date range
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        # Generate mock data based on type
        if data_type == "alerts":
            raw_data = [
                {
                    "id": "alert_001",
                    "type": "flood",
                    "severity": "high",
                    "location": "Downtown",
                    "created_at": "2024-01-20T10:30:00Z",
                    "resolved_at": None
                },
                {
                    "id": "alert_002",
                    "type": "heatwave",
                    "severity": "moderate",
                    "location": "Suburbs",
                    "created_at": "2024-01-19T14:15:00Z",
                    "resolved_at": "2024-01-20T08:00:00Z"
                }
            ]
        
        elif data_type == "predictions":
            raw_data = [
                {
                    "id": "pred_001",
                    "type": "flood",
                    "risk_score": 75.5,
                    "location": "River District",
                    "predicted_at": "2024-01-20T09:00:00Z",
                    "accuracy": 87.2
                }
            ]
        
        else:
            raw_data = []
        
        if format == ReportFormat.CSV:
            # Convert to CSV
            df = pd.DataFrame(raw_data)
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_content = csv_buffer.getvalue()
            
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={data_type}_export_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
        
        elif format == ReportFormat.JSON:
            return {
                "status": "success",
                "data_type": data_type,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "count": len(raw_data),
                "data": raw_data,
                "exported_at": datetime.now().isoformat()
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Format {format} not supported for data export")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data export failed: {str(e)}")

@router.get("/scheduled-reports")
async def get_scheduled_reports(current_user = Depends(get_current_user)):
    """Get user's scheduled report configurations"""
    try:
        # Mock scheduled reports
        scheduled_reports = [
            {
                "id": "schedule_001",
                "name": "Weekly Disaster Summary",
                "report_type": "disaster_summary",
                "format": "pdf",
                "frequency": "weekly",
                "next_run": "2024-01-27T09:00:00Z",
                "enabled": True
            },
            {
                "id": "schedule_002", 
                "name": "Monthly Risk Assessment",
                "report_type": "risk_assessment",
                "format": "excel",
                "frequency": "monthly",
                "next_run": "2024-02-01T09:00:00Z",
                "enabled": False
            }
        ]
        
        return {
            "status": "success",
            "scheduled_reports": scheduled_reports,
            "count": len(scheduled_reports)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scheduled reports: {str(e)}")

# Helper functions for report generation
async def generate_disaster_summary_data(start_date: datetime, end_date: datetime, location_filter: str = None):
    """Generate disaster summary report data"""
    return {
        "summary": {
            "total_events": 45,
            "most_common_type": "flood",
            "highest_risk_location": "Downtown District",
            "avg_response_time": "4.2 minutes"
        },
        "events_by_type": {
            "flood": 18,
            "heatwave": 12,
            "storm": 8,
            "wildfire": 4,
            "earthquake": 3
        },
        "timeline": [
            {"date": "2024-01-15", "events": 3, "severity_avg": 2.7},
            {"date": "2024-01-16", "events": 5, "severity_avg": 3.2},
            {"date": "2024-01-17", "events": 2, "severity_avg": 2.1}
        ]
    }

async def generate_risk_assessment_data(start_date: datetime, end_date: datetime, location_filter: str = None):
    """Generate risk assessment report data"""
    return {
        "risk_overview": {
            "overall_risk_level": "Moderate",
            "highest_risk_areas": ["River District", "Industrial Zone"],
            "emerging_threats": ["Seasonal flooding", "Heat dome formation"]
        },
        "predictions": {
            "total_predictions": 156,
            "accuracy_rate": 87.5,
            "high_confidence": 89
        }
    }

async def generate_misinformation_analysis_data(start_date: datetime, end_date: datetime):
    """Generate misinformation analysis report data"""
    return {
        "detection_summary": {
            "total_analyzed": 1247,
            "misinformation_detected": 234,
            "accuracy_rate": 91.3,
            "false_positives": 12
        },
        "trending_topics": [
            {"topic": "weather_manipulation", "mentions": 145, "risk_score": 78},
            {"topic": "false_evacuation", "mentions": 89, "risk_score": 85}
        ]
    }

async def generate_default_report_data():
    """Generate default report data"""
    return {
        "message": "Default report data",
        "generated_at": datetime.now().isoformat()
    }

async def generate_pdf_report(data: dict, report_type: ReportType, user_id: str, include_charts: bool = True):
    """Generate PDF report"""
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.close()
    
    # Create PDF
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph(f"Aegis Vision - {report_type.value.replace('_', ' ').title()} Report", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Date range
    date_info = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal'])
    story.append(date_info)
    story.append(Spacer(1, 12))
    
    # Add data sections
    for section, content in data.items():
        section_title = Paragraph(section.replace('_', ' ').title(), styles['Heading2'])
        story.append(section_title)
        
        if isinstance(content, dict):
            for key, value in content.items():
                item_text = f"{key.replace('_', ' ').title()}: {value}"
                item = Paragraph(item_text, styles['Normal'])
                story.append(item)
        elif isinstance(content, list):
            for item in content[:5]:  # Limit to first 5 items
                item_text = str(item)
                item_para = Paragraph(item_text, styles['Normal'])
                story.append(item_para)
        else:
            content_para = Paragraph(str(content), styles['Normal'])
            story.append(content_para)
        
        story.append(Spacer(1, 12))
    
    # Build PDF
    doc.build(story)
    
    return temp_file.name

async def generate_csv_report(data: dict):
    """Generate CSV report"""
    # Flatten data for CSV
    rows = []
    for section, content in data.items():
        if isinstance(content, dict):
            for key, value in content.items():
                rows.append([section, key, str(value)])
        else:
            rows.append([section, "", str(content)])
    
    # Create CSV
    df = pd.DataFrame(rows, columns=['Section', 'Metric', 'Value'])
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    
    return csv_buffer.getvalue()