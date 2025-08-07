const express = require('express');
const router = express.Router();
const socialMediaService = require('../services/social-media-service');
const logger = require('../utils/logger');

// Get recent social media posts
router.get('/recent', async (req, res) => {
    try {
        const { limit = 50, platform } = req.query;
        const socialData = await socialMediaService.collectLatestData();
        
        let filteredData = socialData;
        if (platform) {
            filteredData = socialData.filter(post => post.platform === platform);
        }
        
        filteredData = filteredData.slice(0, parseInt(limit));
        
        res.json({
            status: 'success',
            data: filteredData,
            count: filteredData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching social media data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch social media data',
            error: error.message
        });
    }
});

// Get posts by platform
router.get('/platform/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { limit = 20 } = req.query;
        
        const socialData = await socialMediaService.collectLatestData();
        const platformData = socialData
            .filter(post => post.platform === platform)
            .slice(0, parseInt(limit));
        
        res.json({
            status: 'success',
            platform,
            data: platformData,
            count: platformData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error fetching ${req.params.platform} data:`, error);
        res.status(500).json({
            status: 'error',
            message: `Failed to fetch ${req.params.platform} data`,
            error: error.message
        });
    }
});

// Get posts by keyword
router.get('/search', async (req, res) => {
    try {
        const { keyword, limit = 20 } = req.query;
        
        if (!keyword) {
            return res.status(400).json({
                status: 'error',
                message: 'Keyword parameter is required'
            });
        }
        
        const socialData = await socialMediaService.collectLatestData();
        const keywordData = socialData
            .filter(post => 
                post.content.toLowerCase().includes(keyword.toLowerCase()) ||
                post.disaster_related
            )
            .slice(0, parseInt(limit));
        
        res.json({
            status: 'success',
            keyword,
            data: keywordData,
            count: keywordData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error searching social media data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to search social media data',
            error: error.message
        });
    }
});

// Get social media service status
router.get('/status', (req, res) => {
    try {
        const status = socialMediaService.getStatus();
        res.json({
            status: 'success',
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting social media service status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service status',
            error: error.message
        });
    }
});

module.exports = router;