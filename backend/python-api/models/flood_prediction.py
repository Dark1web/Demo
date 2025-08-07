import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, classification_report
import joblib
import os
from typing import Dict, List, Tuple
from datetime import datetime, timedelta

class FloodRiskPredictor:
    def __init__(self):
        self.regression_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.classification_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = [
            'rainfall_24h', 'rainfall_7d', 'soil_moisture', 'river_level',
            'elevation', 'slope', 'drainage_density', 'land_use_urban',
            'population_density', 'historical_floods', 'season'
        ]
    
    def prepare_features(self, data: Dict) -> np.ndarray:
        """Prepare input features for prediction"""
        features = []
        
        # Weather features
        features.append(data.get('rainfall_24h', 0))  # mm
        features.append(data.get('rainfall_7d', 0))   # mm
        features.append(data.get('soil_moisture', 50)) # percentage
        features.append(data.get('river_level', 0))   # meters above normal
        
        # Geographical features
        features.append(data.get('elevation', 100))   # meters
        features.append(data.get('slope', 5))         # degrees
        features.append(data.get('drainage_density', 1)) # km/km²
        features.append(data.get('land_use_urban', 0.3)) # percentage
        
        # Demographic features
        features.append(data.get('population_density', 1000)) # people/km²
        features.append(data.get('historical_floods', 0))     # count in 10 years
        
        # Temporal features
        current_month = datetime.now().month
        season = 0  # Winter
        if 3 <= current_month <= 5: season = 1  # Spring
        elif 6 <= current_month <= 8: season = 2  # Summer
        elif 9 <= current_month <= 11: season = 3  # Autumn
        features.append(season)
        
        return np.array(features).reshape(1, -1)
    
    def generate_synthetic_training_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        
        # Generate random features
        data = np.random.rand(n_samples, len(self.feature_names))
        
        # Scale features to realistic ranges
        data[:, 0] *= 200  # rainfall_24h: 0-200mm
        data[:, 1] *= 500  # rainfall_7d: 0-500mm
        data[:, 2] *= 100  # soil_moisture: 0-100%
        data[:, 3] = (data[:, 3] - 0.5) * 10  # river_level: -5 to +5m
        data[:, 4] *= 2000  # elevation: 0-2000m
        data[:, 5] *= 45   # slope: 0-45 degrees
        data[:, 6] *= 5    # drainage_density: 0-5 km/km²
        data[:, 7] *= 1    # land_use_urban: 0-1
        data[:, 8] *= 10000  # population_density: 0-10000 people/km²
        data[:, 9] = np.random.poisson(2, n_samples)  # historical_floods
        data[:, 10] = np.random.randint(0, 4, n_samples)  # season
        
        # Generate flood risk score (0-100)
        flood_risk = (
            data[:, 0] * 0.3 +  # rainfall_24h
            data[:, 1] * 0.1 +  # rainfall_7d
            (100 - data[:, 2]) * 0.2 +  # inverse soil_moisture
            np.maximum(0, data[:, 3]) * 10 +  # positive river_level
            np.maximum(0, 200 - data[:, 4]) * 0.1 +  # lower elevation = higher risk
            data[:, 9] * 5  # historical floods
        )
        flood_risk = np.clip(flood_risk, 0, 100)
        
        # Generate flood probability (binary classification)
        flood_probability = (flood_risk > 60).astype(int)
        
        return data, flood_risk, flood_probability
    
    def train_model(self):
        """Train the flood prediction models"""
        print("🔥 Training flood prediction models...")
        
        # Generate synthetic training data
        X, y_risk, y_prob = self.generate_synthetic_training_data(2000)
        
        # Split data
        X_train, X_test, y_risk_train, y_risk_test, y_prob_train, y_prob_test = train_test_split(
            X, y_risk, y_prob, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train regression model (risk score)
        self.regression_model.fit(X_train_scaled, y_risk_train)
        risk_predictions = self.regression_model.predict(X_test_scaled)
        risk_mse = mean_squared_error(y_risk_test, risk_predictions)
        
        # Train classification model (flood probability)
        self.classification_model.fit(X_train_scaled, y_prob_train)
        prob_predictions = self.classification_model.predict(X_test_scaled)
        
        self.is_trained = True
        
        print(f"✅ Flood Risk Model - MSE: {risk_mse:.2f}")
        print(f"✅ Flood Probability Model trained successfully")
        
        return {
            "risk_mse": risk_mse,
            "classification_report": classification_report(y_prob_test, prob_predictions, output_dict=True)
        }
    
    def predict_flood_risk(self, input_data: Dict) -> Dict:
        """Predict flood risk and probability"""
        if not self.is_trained:
            self.train_model()
        
        # Prepare features
        features = self.prepare_features(input_data)
        features_scaled = self.scaler.transform(features)
        
        # Get predictions
        risk_score = self.regression_model.predict(features_scaled)[0]
        flood_probability = self.classification_model.predict_proba(features_scaled)[0]
        
        # Risk level classification
        if risk_score < 30:
            risk_level = "Low"
            color = "green"
        elif risk_score < 60:
            risk_level = "Moderate"
            color = "yellow"
        elif risk_score < 80:
            risk_level = "High"
            color = "orange"
        else:
            risk_level = "Critical"
            color = "red"
        
        # Get feature importance
        feature_importance = dict(zip(
            self.feature_names,
            self.regression_model.feature_importances_
        ))
        
        return {
            "risk_score": float(np.clip(risk_score, 0, 100)),
            "risk_level": risk_level,
            "risk_color": color,
            "flood_probability": {
                "no_flood": float(flood_probability[0]),
                "flood": float(flood_probability[1])
            },
            "confidence": float(np.max(flood_probability)),
            "feature_importance": feature_importance,
            "recommendations": self._generate_recommendations(risk_score, input_data),
            "prediction_timestamp": datetime.now().isoformat()
        }
    
    def _generate_recommendations(self, risk_score: float, input_data: Dict) -> List[str]:
        """Generate recommendations based on risk score and input data"""
        recommendations = []
        
        if risk_score > 70:
            recommendations.append("🚨 IMMEDIATE ACTION: Consider evacuation from low-lying areas")
            recommendations.append("📱 Monitor emergency services alerts closely")
        
        if input_data.get('rainfall_24h', 0) > 100:
            recommendations.append("☔ Heavy rainfall detected - avoid unnecessary travel")
        
        if input_data.get('river_level', 0) > 3:
            recommendations.append("🌊 River levels elevated - stay away from waterways")
        
        if input_data.get('soil_moisture', 50) > 80:
            recommendations.append("💧 Soil saturation high - increased landslide risk")
        
        if risk_score > 50:
            recommendations.append("🎒 Prepare emergency kit with water, food, and first aid")
            recommendations.append("🔋 Ensure devices are charged and have backup power")
        
        if not recommendations:
            recommendations.append("✅ Risk levels are currently manageable")
            recommendations.append("📊 Continue monitoring conditions")
        
        return recommendations
    
    def save_model(self, filepath: str):
        """Save trained model to disk"""
        if self.is_trained:
            model_data = {
                'regression_model': self.regression_model,
                'classification_model': self.classification_model,
                'scaler': self.scaler,
                'feature_names': self.feature_names
            }
            joblib.dump(model_data, filepath)
            print(f"✅ Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model from disk"""
        if os.path.exists(filepath):
            model_data = joblib.load(filepath)
            self.regression_model = model_data['regression_model']
            self.classification_model = model_data['classification_model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.is_trained = True
            print(f"✅ Model loaded from {filepath}")
        else:
            print(f"⚠️ Model file not found: {filepath}")

# Global model instance
flood_predictor = FloodRiskPredictor()