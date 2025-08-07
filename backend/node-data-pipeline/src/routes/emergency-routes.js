const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock emergency service for now
const emergencyService = {
    async collectLatestData() {
        return [
            {
                id: 'emergency_001',
                type: 'flood',
                severity: 'high',
                title: 'Flash Flood Emergency',
                message: 'Flash flood warning in effect for downtown area. Immediate evacuation required.',
                location: 'Downtown District',
                coordinates: { lat: 40.7128, lon: -74.0060 },
                source: 'Emergency Management',
                is_official: true,
                issued_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString()
            },
            {
                id: 'emergency_002',
                type: 'heatwave',
                severity: 'moderate',
                title: 'Heat Advisory',
                message: 'Extreme heat conditions expected. Stay hydrated and avoid outdoor activities.',
                location: 'Metropolitan Area',
                coordinates: { lat: 40.7580, lon: -73.9855 },
                source: 'Weather Service',
                is_official: true,
                issued_at: new Date(Date.now() - 1800000).toISOString(),
                expires_at: new Date(Date.now() + 7200000).toISOString()
            }
        ];
    }
};

// Get emergency alerts
router.get('/alerts', async (req, res) => {
    try {
        const { active = true, type } = req.query;
        const emergencyData = await emergencyService.collectLatestData();
        
        let filteredData = emergencyData;
        
        if (active === 'true') {
            const now = new Date();
            filteredData = emergencyData.filter(alert => 
                new Date(alert.expires_at) > now
            );
        }
        
        if (type) {
            filteredData = filteredData.filter(alert => alert.type === type);
        }
        
        res.json({
            status: 'success',
            data: filteredData,
            count: filteredData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching emergency alerts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch emergency alerts',
            error: error.message
        });
    }
});

// Get emergency alerts by type
router.get('/alerts/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { active = true } = req.query;
        
        const emergencyData = await emergencyService.collectLatestData();
        let filteredData = emergencyData.filter(alert => alert.type === type);
        
        if (active === 'true') {
            const now = new Date();
            filteredData = filteredData.filter(alert => 
                new Date(alert.expires_at) > now
            );
        }
        
        res.json({
            status: 'success',
            type,
            data: filteredData,
            count: filteredData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error fetching ${req.params.type} emergency alerts:`, error);
        res.status(500).json({
            status: 'error',
            message: `Failed to fetch ${req.params.type} emergency alerts`,
            error: error.message
        });
    }
});

module.exports = router;