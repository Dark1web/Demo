const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather-service');
const logger = require('../utils/logger');

// Get current weather data
router.get('/current', async (req, res) => {
    try {
        const weatherData = await weatherService.collectLatestData();
        res.json({
            status: 'success',
            data: weatherData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching current weather:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch weather data',
            error: error.message
        });
    }
});

// Get weather forecast
router.get('/forecast', async (req, res) => {
    try {
        const { location } = req.query;
        const forecastData = await weatherService.getForecast({ name: location || 'New York' });
        res.json({
            status: 'success',
            data: forecastData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching weather forecast:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch forecast data',
            error: error.message
        });
    }
});

// Get weather alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await weatherService.getWeatherAlerts();
        res.json({
            status: 'success',
            data: alerts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching weather alerts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch weather alerts',
            error: error.message
        });
    }
});

// Get weather service status
router.get('/status', (req, res) => {
    try {
        const status = weatherService.getStatus();
        res.json({
            status: 'success',
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting weather service status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service status',
            error: error.message
        });
    }
});

module.exports = router;