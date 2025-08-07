const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Get data sources status
router.get('/sources', (req, res) => {
    try {
        const sources = {
            weather: {
                name: 'Weather APIs',
                status: 'active',
                last_update: new Date().toISOString(),
                endpoints: ['OpenWeatherMap', 'Weather.gov'],
                data_points: Math.floor(Math.random() * 1000) + 500
            },
            social_media: {
                name: 'Social Media',
                status: 'active',
                last_update: new Date().toISOString(),
                platforms: ['Twitter', 'Mastodon'],
                data_points: Math.floor(Math.random() * 5000) + 2000
            },
            news: {
                name: 'News Feeds',
                status: 'active',
                last_update: new Date().toISOString(),
                sources: ['RSS Feeds', 'Official Press'],
                data_points: Math.floor(Math.random() * 200) + 100
            },
            emergency: {
                name: 'Emergency Services',
                status: 'active',
                last_update: new Date().toISOString(),
                sources: ['Emergency Alerts', 'Public Safety'],
                data_points: Math.floor(Math.random() * 50) + 20
            }
        };
        
        res.json({
            status: 'success',
            data: sources,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting data sources status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get data sources status',
            error: error.message
        });
    }
});

// Get data collection statistics
router.get('/stats', (req, res) => {
    try {
        const stats = {
            total_data_points: Math.floor(Math.random() * 10000) + 5000,
            data_points_today: Math.floor(Math.random() * 1000) + 200,
            active_sources: 4,
            last_collection: new Date().toISOString(),
            collection_frequency: '5 minutes',
            error_rate: '0.5%',
            processing_time_avg: '2.3s'
        };
        
        res.json({
            status: 'success',
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting data statistics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get data statistics',
            error: error.message
        });
    }
});

// Get recent data collection logs
router.get('/logs', (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const logs = [
            {
                id: 'log_001',
                source: 'weather',
                status: 'success',
                data_points: 45,
                duration: '1.2s',
                timestamp: new Date().toISOString()
            },
            {
                id: 'log_002',
                source: 'social_media',
                status: 'success',
                data_points: 234,
                duration: '3.1s',
                timestamp: new Date(Date.now() - 300000).toISOString()
            },
            {
                id: 'log_003',
                source: 'news',
                status: 'success',
                data_points: 12,
                duration: '0.8s',
                timestamp: new Date(Date.now() - 600000).toISOString()
            }
        ];
        
        res.json({
            status: 'success',
            data: logs.slice(0, parseInt(limit)),
            count: logs.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting data collection logs:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get data collection logs',
            error: error.message
        });
    }
});

module.exports = router;