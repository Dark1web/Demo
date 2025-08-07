const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectToSupabase } = require('./config/database');
const weatherService = require('./services/weather-service');
const socialMediaService = require('./services/social-media-service');
const newsService = require('./services/news-service');
const emergencyService = require('./services/emergency-service');

class DataPipelineApp {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:8080",
                methods: ["GET", "POST"]
            }
        });
        this.port = process.env.PORT || 3001;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeServices();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        this.app.use(compression());
        
        // CORS
        this.app.use(cors({
            origin: [
                process.env.FRONTEND_URL || "http://localhost:8080",
                process.env.PYTHON_API_URL || "http://localhost:8000"
            ],
            credentials: true
        }));
        
        // Logging
        this.app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Data Collection Pipeline',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                services: {
                    weather: weatherService.isConnected(),
                    social_media: socialMediaService.isConnected(),
                    news: newsService.isConnected(),
                    emergency: emergencyService.isConnected()
                }
            });
        });

        // API routes
        this.app.use('/api/weather', require('./routes/weather-routes'));
        this.app.use('/api/social', require('./routes/social-routes'));
        this.app.use('/api/news', require('./routes/news-routes'));
        this.app.use('/api/emergency', require('./routes/emergency-routes'));
        this.app.use('/api/data', require('./routes/data-routes'));

        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                pipeline_status: 'active',
                data_sources: {
                    weather_apis: weatherService.getStatus(),
                    social_media: socialMediaService.getStatus(),
                    news_feeds: newsService.getStatus(),
                    emergency_services: emergencyService.getStatus()
                },
                last_update: new Date().toISOString(),
                data_points_collected: this.getDataPointsCount()
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                message: 'The requested resource does not exist'
            });
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Subscribe to data streams
            socket.on('subscribe', (dataTypes) => {
                logger.info(`Client ${socket.id} subscribed to: ${dataTypes.join(', ')}`);
                dataTypes.forEach(type => {
                    socket.join(`stream_${type}`);
                });
            });

            // Unsubscribe from data streams
            socket.on('unsubscribe', (dataTypes) => {
                logger.info(`Client ${socket.id} unsubscribed from: ${dataTypes.join(', ')}`);
                dataTypes.forEach(type => {
                    socket.leave(`stream_${type}`);
                });
            });

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }

    async initializeServices() {
        try {
            logger.info('🚀 Initializing data collection services...');

            // Connect to database
            await connectToSupabase();
            logger.info('✅ Database connection established');

            // Initialize data collection services
            await weatherService.initialize();
            logger.info('✅ Weather service initialized');

            await socialMediaService.initialize();
            logger.info('✅ Social media service initialized');

            await newsService.initialize();
            logger.info('✅ News service initialized');

            await emergencyService.initialize();
            logger.info('✅ Emergency service initialized');

            // Start data collection
            this.startDataCollection();
            logger.info('✅ Data collection started');

        } catch (error) {
            logger.error('❌ Failed to initialize services:', error);
            process.exit(1);
        }
    }

    startDataCollection() {
        // Real-time data streams
        setInterval(() => {
            this.collectAndBroadcastWeatherData();
        }, 5 * 60 * 1000); // Every 5 minutes

        setInterval(() => {
            this.collectAndBroadcastSocialMedia();
        }, 2 * 60 * 1000); // Every 2 minutes

        setInterval(() => {
            this.collectAndBroadcastNews();
        }, 10 * 60 * 1000); // Every 10 minutes

        setInterval(() => {
            this.collectAndBroadcastEmergencyData();
        }, 1 * 60 * 1000); // Every minute

        logger.info('✅ Real-time data collection scheduled');
    }

    async collectAndBroadcastWeatherData() {
        try {
            const weatherData = await weatherService.collectLatestData();
            
            // Broadcast to subscribed clients
            this.io.to('stream_weather').emit('weather_update', {
                timestamp: new Date().toISOString(),
                data: weatherData
            });

            // Process for alerts
            await this.processWeatherAlerts(weatherData);

        } catch (error) {
            logger.error('Error collecting weather data:', error);
        }
    }

    async collectAndBroadcastSocialMedia() {
        try {
            const socialData = await socialMediaService.collectLatestData();
            
            // Broadcast to subscribed clients
            this.io.to('stream_social').emit('social_update', {
                timestamp: new Date().toISOString(),
                data: socialData
            });

            // Process for misinformation
            await this.processSocialMediaData(socialData);

        } catch (error) {
            logger.error('Error collecting social media data:', error);
        }
    }

    async collectAndBroadcastNews() {
        try {
            const newsData = await newsService.collectLatestData();
            
            // Broadcast to subscribed clients
            this.io.to('stream_news').emit('news_update', {
                timestamp: new Date().toISOString(),
                data: newsData
            });

        } catch (error) {
            logger.error('Error collecting news data:', error);
        }
    }

    async collectAndBroadcastEmergencyData() {
        try {
            const emergencyData = await emergencyService.collectLatestData();
            
            // Broadcast to subscribed clients
            this.io.to('stream_emergency').emit('emergency_update', {
                timestamp: new Date().toISOString(),
                data: emergencyData
            });

            // Process for immediate alerts
            await this.processEmergencyAlerts(emergencyData);

        } catch (error) {
            logger.error('Error collecting emergency data:', error);
        }
    }

    async processWeatherAlerts(weatherData) {
        // Check for severe weather conditions
        for (const dataPoint of weatherData) {
            if (dataPoint.severity === 'high' || dataPoint.severity === 'critical') {
                // Send to Python API for ML processing
                await this.sendToPythonAPI('/api/alerts/create', {
                    type: 'weather',
                    severity: dataPoint.severity,
                    title: `Severe Weather Alert - ${dataPoint.type}`,
                    message: dataPoint.description,
                    location: dataPoint.location,
                    latitude: dataPoint.coordinates?.lat,
                    longitude: dataPoint.coordinates?.lon,
                    metadata: dataPoint
                });
            }
        }
    }

    async processSocialMediaData(socialData) {
        // Send to Python API for misinformation analysis
        for (const post of socialData) {
            if (post.disaster_related) {
                await this.sendToPythonAPI('/api/misinformation/analyze', {
                    text: post.content,
                    source_url: post.url,
                    author: post.author,
                    platform: post.platform,
                    likes: post.engagement?.likes,
                    shares: post.engagement?.shares,
                    comments: post.engagement?.comments,
                    author_followers: post.author_followers,
                    hours_since_post: post.hours_since_post
                });
            }
        }
    }

    async processEmergencyAlerts(emergencyData) {
        // Process official emergency alerts
        for (const alert of emergencyData) {
            if (alert.is_official && alert.severity !== 'low') {
                await this.sendToPythonAPI('/api/alerts/create', {
                    type: alert.type,
                    severity: alert.severity,
                    title: alert.title,
                    message: alert.message,
                    location: alert.location,
                    latitude: alert.coordinates?.lat,
                    longitude: alert.coordinates?.lon,
                    metadata: {
                        source: alert.source,
                        alert_id: alert.id,
                        issued_by: alert.agency
                    }
                });
            }
        }
    }

    async sendToPythonAPI(endpoint, data) {
        try {
            const axios = require('axios');
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
            
            await axios.post(`${pythonApiUrl}${endpoint}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.PYTHON_API_TOKEN || ''}`
                },
                timeout: 10000
            });

        } catch (error) {
            logger.error(`Failed to send data to Python API (${endpoint}):`, error.message);
        }
    }

    getDataPointsCount() {
        // Mock implementation - would track actual data points collected
        return {
            weather: Math.floor(Math.random() * 1000) + 500,
            social_media: Math.floor(Math.random() * 5000) + 2000,
            news: Math.floor(Math.random() * 200) + 100,
            emergency: Math.floor(Math.random() * 50) + 20
        };
    }

    start() {
        this.server.listen(this.port, () => {
            logger.info(`🌟 Data Pipeline Server running on port ${this.port}`);
            logger.info(`📊 WebSocket server active for real-time data streams`);
            logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        });
    }

    async shutdown() {
        logger.info('🛑 Shutting down data pipeline...');
        
        // Stop data collection
        // Close database connections
        // Clean up resources
        
        this.server.close(() => {
            logger.info('✅ Data pipeline shut down complete');
            process.exit(0);
        });
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => app.shutdown());
process.on('SIGINT', () => app.shutdown());

// Start the application
const app = new DataPipelineApp();
app.start();

module.exports = DataPipelineApp;