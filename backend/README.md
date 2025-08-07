# Aegis Vision Backend

A comprehensive disaster management backend system with real-time data collection, ML-powered predictions, and multi-channel alerting.

## 🏗️ Architecture

### Services Overview

- **Python FastAPI Service** (Port 8000) - ML/AI processing, predictions, alerts
- **Node.js Data Pipeline** (Port 3001) - Data collection, web scraping, real-time streams
- **Redis** - Caching and rate limiting
- **Supabase** - Database and authentication
- **WebSocket** - Real-time communication

### Key Features

🌦️ **Weather Data Collection**
- OpenWeatherMap API integration
- Real-time weather monitoring
- Severe weather detection
- Flood risk assessment

🤖 **ML/AI Capabilities**
- Flood risk prediction
- Heatwave risk assessment
- Misinformation detection
- Real-time analysis

📱 **Multi-Channel Alerts**
- Email notifications
- SMS via Twilio
- Telegram bot
- Slack/Discord webhooks
- Real-time WebSocket updates

🔍 **Data Sources**
- Weather APIs
- Social media monitoring (Twitter, Mastodon)
- News feed aggregation
- Emergency service alerts

📊 **Analytics & Reporting**
- Real-time dashboards
- Comprehensive reports (PDF, CSV, JSON)
- Historical data analysis
- Performance metrics

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Redis
- Supabase account
- Docker (optional)

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd aegis-vision/backend
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Option A: Run with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Option B: Run manually**

   **Python API:**
   ```bash
   cd python-api
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   uvicorn main:app --reload --port 8000
   ```

   **Node.js Pipeline:**
   ```bash
   cd node-data-pipeline
   npm install
   npm run dev
   ```

### Verification

- Python API: http://localhost:8000/docs
- Node Pipeline: http://localhost:3001/health
- Health checks: Both services should return 200 OK

## 📋 API Documentation

### Python FastAPI Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

#### ML Predictions
- `POST /api/predict/flood` - Flood risk prediction
- `POST /api/predict/heatwave` - Heatwave risk assessment
- `GET /api/predict/history` - Prediction history

#### Misinformation Detection
- `POST /api/misinformation/analyze` - Analyze text for misinformation
- `POST /api/misinformation/bulk-analyze` - Bulk text analysis
- `GET /api/misinformation/trending-topics` - Get trending misinformation

#### Alerts & Notifications
- `POST /api/alerts/create` - Create new alert
- `GET /api/alerts/active` - Get active alerts
- `POST /api/alerts/preferences` - Update notification preferences

#### Reports & Analytics
- `POST /api/reports/generate` - Generate comprehensive reports
- `GET /api/reports/dashboard-metrics` - Real-time metrics
- `GET /api/reports/analytics` - Analytics data

### Node.js Data Pipeline Endpoints

#### Data Collection
- `GET /api/weather/current` - Current weather data
- `GET /api/social/recent` - Recent social media posts
- `GET /api/news/latest` - Latest news articles
- `GET /api/emergency/alerts` - Emergency service alerts

#### System Status
- `GET /health` - Service health check
- `GET /status` - Detailed system status
- `GET /api/data/sources` - Data source status

### WebSocket Events

#### Client → Server
- `subscribe` - Subscribe to data streams
- `unsubscribe` - Unsubscribe from streams

#### Server → Client
- `weather_update` - Real-time weather data
- `social_update` - Social media monitoring
- `emergency_update` - Emergency alerts
- `alert` - Disaster alerts

## ⚙️ Configuration

### Required Environment Variables

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Weather APIs
OPENWEATHER_API_KEY=your_openweather_key

# Social Media
TWITTER_BEARER_TOKEN=your_twitter_token
MASTODON_ACCESS_TOKEN=your_mastodon_token

# Notifications
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### Optional Services

- **Telegram Bot**: Set `TELEGRAM_BOT_TOKEN`
- **Slack Integration**: Set `SLACK_WEBHOOK_URL`
- **Discord Alerts**: Set `DISCORD_WEBHOOK_URL`
- **Error Tracking**: Set `SENTRY_DSN`

## 🔐 Security Features

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- SQL injection prevention
- XSS protection
- Secure password hashing

## 📊 Monitoring

### Health Checks
- `/health` endpoints on both services
- Database connectivity checks
- External API status monitoring
- WebSocket connection tracking

### Metrics (with Prometheus/Grafana)
- Request/response times
- Error rates
- Data collection statistics
- ML model performance
- Alert delivery success rates

## 🛠️ Development

### Project Structure

```
backend/
├── python-api/          # FastAPI service
│   ├── main.py          # Application entry point
│   ├── models/          # ML models
│   ├── routers/         # API endpoints
│   ├── services/        # Business logic
│   └── requirements.txt # Python dependencies
├── node-data-pipeline/  # Node.js service
│   ├── src/
│   │   ├── app.js       # Application entry point
│   │   ├── services/    # Data collection services
│   │   ├── scrapers/    # Web scraping modules
│   │   └── schedulers/  # Cron jobs
│   └── package.json     # Node dependencies
├── docker-compose.yml   # Docker orchestration
└── .env.example         # Environment template
```

### Adding New Data Sources

1. Create new service in `node-data-pipeline/src/services/`
2. Implement data collection and processing
3. Add to main application in `app.js`
4. Update database schema if needed
5. Add tests and documentation

### Adding New ML Models

1. Create model class in `python-api/models/`
2. Add training and prediction methods
3. Create API endpoints in `routers/`
4. Add to main application
5. Update model documentation

## 🧪 Testing

### Run Tests

```bash
# Python tests
cd python-api
pytest tests/

# Node.js tests
cd node-data-pipeline
npm test
```

### Test Coverage

- Unit tests for all models and services
- Integration tests for API endpoints
- End-to-end tests for critical flows
- Performance tests for high-load scenarios

## 📈 Performance

### Optimization Features

- Redis caching for frequent queries
- Rate limiting to prevent abuse
- Async processing for heavy operations
- Background tasks for non-critical operations
- Database query optimization
- Horizontal scaling support

### Scaling Considerations

- Stateless services for easy scaling
- Background job queues for async processing
- Load balancing ready
- Database connection pooling
- Microservice architecture

## 🔧 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify all API keys in `.env`
   - Check API key permissions and quotas

2. **Database Connection**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure proper table permissions

3. **WebSocket Issues**
   - Check CORS settings
   - Verify frontend URL configuration
   - Monitor connection logs

4. **Model Loading Errors**
   - Ensure spaCy models are downloaded
   - Check model file permissions
   - Verify dependencies are installed

### Logs

- Application logs: `./logs/`
- Container logs: `docker-compose logs [service]`
- Database logs: Check Supabase dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: `/docs` endpoints
- Health checks: `/health` endpoints
- Monitoring: Grafana dashboards (if enabled)
- Logs: Check application and container logs

For additional support, check the main project README or create an issue in the repository.