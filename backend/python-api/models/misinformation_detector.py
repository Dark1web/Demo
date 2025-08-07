import numpy as np
import pandas as pd
import re
from typing import Dict, List, Tuple
from datetime import datetime
import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class MisinformationDetector:
    def __init__(self):
        self.sentiment_analyzer = None
        self.text_classifier = None
        self.tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        self.naive_bayes = MultinomialNB()
        self.nlp = None
        self.is_trained = False
        
        # Disaster-related keywords for context analysis
        self.disaster_keywords = {
            'flood': ['flood', 'flooding', 'deluge', 'inundation', 'overflow', 'drowning'],
            'fire': ['fire', 'wildfire', 'burning', 'smoke', 'blaze', 'inferno'],
            'earthquake': ['earthquake', 'quake', 'tremor', 'seismic', 'aftershock'],
            'hurricane': ['hurricane', 'typhoon', 'cyclone', 'storm', 'tornado'],
            'heatwave': ['heatwave', 'heat dome', 'extreme heat', 'scorching'],
            'emergency': ['emergency', 'evacuation', 'rescue', 'disaster', 'crisis']
        }
        
        # Misinformation indicators
        self.misinformation_indicators = [
            'government conspiracy', 'they don\'t want you to know', 'mainstream media lies',
            'fake news', 'hoax', 'false flag', 'cover-up', 'hidden truth',
            'secret agenda', 'wake up people', 'do your research', 'question everything'
        ]
    
    def initialize_models(self):
        """Initialize NLP models (lightweight for demo)"""
        try:
            # Initialize sentiment analysis
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                return_all_scores=True
            )
            
            # Initialize spaCy for NER
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                print("⚠️ spaCy model not found. Install with: python -m spacy download en_core_web_sm")
                self.nlp = None
            
            print("✅ NLP models initialized successfully")
            
        except Exception as e:
            print(f"⚠️ Error initializing models: {e}")
            # Fallback to simple text analysis
            self.sentiment_analyzer = None
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove mentions and hashtags
        text = re.sub(r'@[A-Za-z0-9_]+', '', text)
        text = re.sub(r'#[A-Za-z0-9_]+', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Convert to lowercase
        text = text.lower()
        
        return text
    
    def extract_entities(self, text: str) -> Dict:
        """Extract named entities from text"""
        entities = {
            'locations': [],
            'organizations': [],
            'persons': [],
            'dates': []
        }
        
        if self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                if ent.label_ in ['GPE', 'LOC']:  # Geopolitical entity, Location
                    entities['locations'].append(ent.text)
                elif ent.label_ in ['ORG']:  # Organization
                    entities['organizations'].append(ent.text)
                elif ent.label_ in ['PERSON']:  # Person
                    entities['persons'].append(ent.text)
                elif ent.label_ in ['DATE', 'TIME']:  # Date, Time
                    entities['dates'].append(ent.text)
        
        return entities
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze text sentiment"""
        if self.sentiment_analyzer:
            try:
                results = self.sentiment_analyzer(text[:512])  # Limit text length
                sentiment_scores = {result['label'].lower(): result['score'] for result in results[0]}
                
                # Determine dominant sentiment
                dominant_sentiment = max(sentiment_scores, key=sentiment_scores.get)
                confidence = sentiment_scores[dominant_sentiment]
                
                return {
                    'dominant_sentiment': dominant_sentiment,
                    'confidence': confidence,
                    'scores': sentiment_scores
                }
            except Exception as e:
                print(f"Sentiment analysis error: {e}")
        
        # Fallback sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'amazing', 'helpful', 'safe']
        negative_words = ['bad', 'terrible', 'awful', 'dangerous', 'scary', 'disaster']
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            return {'dominant_sentiment': 'positive', 'confidence': 0.6, 'scores': {'positive': 0.6, 'negative': 0.4}}
        elif neg_count > pos_count:
            return {'dominant_sentiment': 'negative', 'confidence': 0.6, 'scores': {'positive': 0.4, 'negative': 0.6}}
        else:
            return {'dominant_sentiment': 'neutral', 'confidence': 0.5, 'scores': {'positive': 0.5, 'negative': 0.5}}
    
    def detect_disaster_context(self, text: str) -> Dict:
        """Detect disaster-related context in text"""
        text_lower = text.lower()
        detected_disasters = []
        
        for disaster_type, keywords in self.disaster_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_disasters.append(disaster_type)
        
        return {
            'is_disaster_related': len(detected_disasters) > 0,
            'disaster_types': detected_disasters,
            'urgency_keywords': [word for word in ['urgent', 'emergency', 'immediate', 'critical', 'breaking'] if word in text_lower]
        }
    
    def calculate_virality_score(self, metadata: Dict) -> float:
        """Calculate potential virality score based on engagement metrics"""
        likes = metadata.get('likes', 0)
        shares = metadata.get('shares', 0)
        comments = metadata.get('comments', 0)
        followers = metadata.get('author_followers', 1)
        
        # Normalize metrics
        engagement_rate = (likes + shares * 2 + comments * 3) / max(followers, 1)
        
        # Account for growth rate
        time_since_post = metadata.get('hours_since_post', 1)
        growth_rate = engagement_rate / max(time_since_post, 0.1)
        
        # Scale to 0-100
        virality_score = min(100, growth_rate * 100)
        
        return virality_score
    
    def detect_misinformation_indicators(self, text: str) -> Dict:
        """Detect common misinformation patterns"""
        text_lower = text.lower()
        
        # Check for misinformation indicators
        indicators_found = [indicator for indicator in self.misinformation_indicators if indicator in text_lower]
        
        # Check for other suspicious patterns
        suspicious_patterns = {
            'excessive_caps': len(re.findall(r'[A-Z]{3,}', text)) > 3,
            'excessive_exclamation': text.count('!') > 5,
            'unverified_claims': any(phrase in text_lower for phrase in ['trust me', 'believe me', 'i heard that', 'someone told me']),
            'emotional_manipulation': any(phrase in text_lower for phrase in ['you need to know', 'shocking truth', 'will shock you', 'they hide this']),
            'lack_of_sources': not any(phrase in text_lower for phrase in ['source:', 'according to', 'study shows', 'research indicates'])
        }
        
        risk_score = len(indicators_found) * 20 + sum(suspicious_patterns.values()) * 10
        
        return {
            'indicators_found': indicators_found,
            'suspicious_patterns': suspicious_patterns,
            'risk_score': min(100, risk_score),
            'confidence': min(0.9, risk_score / 100)
        }
    
    def generate_synthetic_training_data(self, n_samples: int = 1000) -> Tuple[List[str], List[int]]:
        """Generate synthetic training data for misinformation detection"""
        texts = []
        labels = []  # 0 = legitimate, 1 = misinformation
        
        # Legitimate disaster information
        legitimate_templates = [
            "Official weather service reports {disaster} warning for {location}. Residents advised to {action}.",
            "Emergency services confirm {disaster} in {location}. Follow evacuation routes as directed.",
            "Local authorities update: {disaster} situation in {location} is under control. Stay informed.",
            "Meteorologists predict {disaster} conditions for {location}. Take necessary precautions.",
            "Red Cross establishes shelter for {disaster} victims in {location}. Donations needed."
        ]
        
        # Misinformation templates
        misinfo_templates = [
            "BREAKING: Government hiding truth about {disaster} in {location}! They don't want you to know!",
            "Wake up people! The {disaster} in {location} is a false flag operation. Do your research!",
            "Mainstream media lies about {disaster}. The real cause is government weather control!",
            "Secret documents reveal {disaster} in {location} was planned. Question everything!",
            "You won't believe what they're hiding about the {disaster}. Share before they delete this!"
        ]
        
        disasters = ['flood', 'wildfire', 'earthquake', 'hurricane', 'heatwave']
        locations = ['California', 'Texas', 'Florida', 'New York', 'Colorado']
        actions = ['evacuate immediately', 'seek higher ground', 'stay indoors', 'follow emergency protocols']
        
        # Generate legitimate samples
        for _ in range(n_samples // 2):
            template = np.random.choice(legitimate_templates)
            text = template.format(
                disaster=np.random.choice(disasters),
                location=np.random.choice(locations),
                action=np.random.choice(actions)
            )
            texts.append(text)
            labels.append(0)
        
        # Generate misinformation samples
        for _ in range(n_samples // 2):
            template = np.random.choice(misinfo_templates)
            text = template.format(
                disaster=np.random.choice(disasters),
                location=np.random.choice(locations)
            )
            texts.append(text)
            labels.append(1)
        
        return texts, labels
    
    def train_classifier(self):
        """Train the misinformation classifier"""
        print("🔥 Training misinformation detection model...")
        
        # Generate training data
        texts, labels = self.generate_synthetic_training_data(2000)
        
        # Preprocess texts
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # Create pipeline
        self.text_classifier = Pipeline([
            ('tfidf', self.tfidf_vectorizer),
            ('classifier', self.naive_bayes)
        ])
        
        # Train model
        X_train, X_test, y_train, y_test = train_test_split(
            processed_texts, labels, test_size=0.2, random_state=42
        )
        
        self.text_classifier.fit(X_train, y_train)
        
        # Evaluate
        accuracy = self.text_classifier.score(X_test, y_test)
        self.is_trained = True
        
        print(f"✅ Misinformation classifier trained with accuracy: {accuracy:.2f}")
        return accuracy
    
    def analyze_text(self, text: str, metadata: Dict = None) -> Dict:
        """Comprehensive text analysis for misinformation detection"""
        if not self.is_trained:
            self.train_classifier()
        
        if metadata is None:
            metadata = {}
        
        # Preprocess text
        processed_text = self.preprocess_text(text)
        
        # Get predictions from ML classifier
        if self.text_classifier:
            misinfo_probability = self.text_classifier.predict_proba([processed_text])[0][1]
            is_misinfo_ml = self.text_classifier.predict([processed_text])[0]
        else:
            misinfo_probability = 0.5
            is_misinfo_ml = 0
        
        # Analyze various aspects
        sentiment = self.analyze_sentiment(text)
        disaster_context = self.detect_disaster_context(text)
        entities = self.extract_entities(text)
        misinfo_indicators = self.detect_misinformation_indicators(text)
        
        # Calculate virality score
        virality_score = self.calculate_virality_score(metadata) if metadata else 0
        
        # Combined risk assessment
        combined_risk = (
            misinfo_probability * 40 +
            misinfo_indicators['risk_score'] * 0.3 +
            (virality_score / 100) * 20 +
            (1 if sentiment['dominant_sentiment'] == 'negative' else 0) * 10
        )
        
        # Risk level classification
        if combined_risk < 30:
            risk_level = "Low"
            risk_color = "green"
        elif combined_risk < 60:
            risk_level = "Moderate"
            risk_color = "yellow"
        elif combined_risk < 80:
            risk_level = "High"
            risk_color = "orange"
        else:
            risk_level = "Critical"
            risk_color = "red"
        
        return {
            "text_analysis": {
                "original_text": text[:200] + "..." if len(text) > 200 else text,
                "processed_text": processed_text[:100] + "..." if len(processed_text) > 100 else processed_text,
                "word_count": len(text.split()),
                "character_count": len(text)
            },
            "misinformation_detection": {
                "is_misinformation": bool(is_misinfo_ml),
                "ml_probability": float(misinfo_probability),
                "risk_score": float(combined_risk),
                "risk_level": risk_level,
                "risk_color": risk_color,
                "confidence": float(misinfo_indicators['confidence'])
            },
            "content_analysis": {
                "sentiment": sentiment,
                "disaster_context": disaster_context,
                "entities": entities,
                "indicators": misinfo_indicators,
                "virality_score": float(virality_score)
            },
            "recommendations": self._generate_recommendations(combined_risk, disaster_context),
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def _generate_recommendations(self, risk_score: float, disaster_context: Dict) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if risk_score > 70:
            recommendations.append("🚨 HIGH RISK: Verify information with official sources before sharing")
            recommendations.append("🔍 Cross-reference with multiple reliable news outlets")
            
        if risk_score > 50:
            recommendations.append("⚠️ Exercise caution when sharing this content")
            recommendations.append("📱 Check official emergency services accounts")
            
        if disaster_context['is_disaster_related']:
            recommendations.append("🏛️ Verify with local emergency management agencies")
            recommendations.append("📺 Consult official weather services and news sources")
            
        if risk_score < 30:
            recommendations.append("✅ Content appears to be from reliable source")
            
        recommendations.append("🤔 Always verify disaster information with multiple sources")
        
        return recommendations

# Global model instance
misinformation_detector = MisinformationDetector()