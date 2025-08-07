const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock news service for now
const newsService = {
    async collectLatestData() {
        return [
            {
                id: 'news_001',
                title: 'Severe Weather Warning Issued for Coastal Areas',
                content: 'The National Weather Service has issued severe weather warnings for coastal regions...',
                source: 'National Weather Service',
                url: 'https://weather.gov/alerts',
                published_at: new Date().toISOString(),
                category: 'weather',
                severity: 'high'
            },
            {
                id: 'news_002',
                title: 'Emergency Response Teams Deployed to Flood-Affected Areas',
                content: 'Emergency response teams have been deployed to areas affected by recent flooding...',
                source: 'Emergency Management Agency',
                url: 'https://ema.gov/response',
                published_at: new Date(Date.now() - 3600000).toISOString(),
                category: 'emergency',
                severity: 'critical'
            }
        ];
    }
};

// Get latest news
router.get('/latest', async (req, res) => {
    try {
        const { limit = 20, category } = req.query;
        const newsData = await newsService.collectLatestData();
        
        let filteredData = newsData;
        if (category) {
            filteredData = newsData.filter(news => news.category === category);
        }
        
        filteredData = filteredData.slice(0, parseInt(limit));
        
        res.json({
            status: 'success',
            data: filteredData,
            count: filteredData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching news data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch news data',
            error: error.message
        });
    }
});

// Get news by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20 } = req.query;
        
        const newsData = await newsService.collectLatestData();
        const categoryData = newsData
            .filter(news => news.category === category)
            .slice(0, parseInt(limit));
        
        res.json({
            status: 'success',
            category,
            data: categoryData,
            count: categoryData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error fetching ${req.params.category} news:`, error);
        res.status(500).json({
            status: 'error',
            message: `Failed to fetch ${req.params.category} news`,
            error: error.message
        });
    }
});

module.exports = router;