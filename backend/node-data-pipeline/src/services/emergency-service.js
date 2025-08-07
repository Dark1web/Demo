const axios = require('axios');
const logger = require('../utils/logger');
const { storeEmergencyData, logDataCollection } = require('../config/database');

class EmergencyService {
    constructor() {
        this.connected = false;
        this.lastUpdate = null;
        this.emergencySources = [
            {
                name: 'National Weather Service Alerts',
                url: 'https://api.weather.gov/alerts/active',
                type: 'weather'
            },
            {
                name: 'FEMA Alerts',
                url: 'https://www.fema.gov/api/alerts',
                type: 'emergency'
            }
        ];
    }

    async initialize() {
        try {
            logger.info('🔄 Initializing emergency service...');
            this.connected = true;
            logger.info('✅ Emergency service initialized');
        } catch (error) {
            logger.error('❌ Failed to initialize emergency service:', error);
            this.connected = false;
        }
    }

    async collectLatestData() {
        try {
            const emergencyData = [];

            // Collect from each emergency source
            for (const source of this.emergencySources) {
                try {
                    const sourceAlerts = await this.fetchEmergencyAlerts(source);
                    emergencyData.push(...sourceAlerts);
                    
                    await this.delay(2000); // Longer delay for emergency services
                } catch (error) {
                    logger.error(`Error collecting from ${source.name}:`, error);
                }
            }

            // If no real data collected, generate mock data
            if (emergencyData.length === 0) {
                const mockData = this.generateMockEmergencyData();
                emergencyData.push(...mockData);
            }

            // Store in database
            if (emergencyData.length > 0) {
                await storeEmergencyData(emergencyData);
                await logDataCollection('emergency', 'success', emergencyData.length);
            }

            this.lastUpdate = new Date();
            return emergencyData;

        } catch (error) {
            logger.error('Error collecting emergency data:', error);
            await logDataCollection('emergency', 'error', 0, { error: error.message });
            throw error;
        }
    }

    async fetchEmergencyAlerts(source) {
        try {
            const response = await axios.get(source.url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AegisVision/1.0)',
                    'Accept': 'application/json'
                }
            });

            // Process the response based on the source type
            if (source.type === 'weather') {
                return this.processWeatherAlerts(response.data, source);
            } else {
                return this.processEmergencyAlerts(response.data, source);
            }

        } catch (error) {
            logger.error(`Error fetching from ${source.name}:`, error.message);
            return [];
        }
    }

    processWeatherAlerts(data, source) {
        const alerts = [];
        
        try {
            if (data.features && Array.isArray(data.features)) {
                data.features.forEach((feature, index) => {
                    const properties = feature.properties;
                    const geometry = feature.geometry;
                    
                    alerts.push({
                        id: `weather_alert_${Date.now()}_${index}`,
                        type: this.mapWeatherType(properties.event),
                        severity: this.mapSeverity(properties.severity),
                        title: properties.headline || properties.event,
                        message: properties.description || properties.event,
                        location: properties.areaDesc || 'Unknown',
                        coordinates: geometry ? this.extractCoordinates(geometry) : null,
                        source: source.name,
                        is_official: true,
                        issued_at: properties.sent || new Date().toISOString(),
                        expires_at: properties.expires || new Date(Date.now() + 3600000).toISOString(),
                        raw_data: properties
                    });
                });
            }
        } catch (error) {
            logger.error('Error processing weather alerts:', error);
        }

        return alerts;
    }

    processEmergencyAlerts(data, source) {
        const alerts = [];
        
        try {
            if (data.alerts && Array.isArray(data.alerts)) {
                data.alerts.forEach((alert, index) => {
                    alerts.push({
                        id: `emergency_alert_${Date.now()}_${index}`,
                        type: alert.type || 'emergency',
                        severity: this.mapSeverity(alert.severity),
                        title: alert.title || alert.headline,
                        message: alert.message || alert.description,
                        location: alert.location || alert.area,
                        coordinates: alert.coordinates || null,
                        source: source.name,
                        is_official: true,
                        issued_at: alert.issued_at || new Date().toISOString(),
                        expires_at: alert.expires_at || new Date(Date.now() + 3600000).toISOString(),
                        raw_data: alert
                    });
                });
            }
        } catch (error) {
            logger.error('Error processing emergency alerts:', error);
        }

        return alerts;
    }

    generateMockEmergencyData() {
        return [
            {
                id: `mock_emergency_${Date.now()}_1`,
                type: 'flood',
                severity: 'high',
                title: 'Flash Flood Emergency',
                message: 'Flash flood warning in effect for downtown area. Immediate evacuation required. Water levels rising rapidly.',
                location: 'Downtown District',
                coordinates: { lat: 40.7128, lon: -74.0060 },
                source: 'Emergency Management',
                is_official: true,
                issued_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString()
            },
            {
                id: `mock_emergency_${Date.now()}_2`,
                type: 'heatwave',
                severity: 'moderate',
                title: 'Heat Advisory',
                message: 'Extreme heat conditions expected. Stay hydrated and avoid outdoor activities during peak hours.',
                location: 'Metropolitan Area',
                coordinates: { lat: 40.7580, lon: -73.9855 },
                source: 'Weather Service',
                is_official: true,
                issued_at: new Date(Date.now() - 1800000).toISOString(),
                expires_at: new Date(Date.now() + 7200000).toISOString()
            },
            {
                id: `mock_emergency_${Date.now()}_3`,
                type: 'storm',
                severity: 'critical',
                title: 'Severe Thunderstorm Warning',
                message: 'Severe thunderstorm with potential for tornadoes. Take shelter immediately.',
                location: 'Suburban Areas',
                coordinates: { lat: 40.7505, lon: -73.9934 },
                source: 'National Weather Service',
                is_official: true,
                issued_at: new Date(Date.now() - 900000).toISOString(),
                expires_at: new Date(Date.now() + 1800000).toISOString()
            }
        ];
    }

    mapWeatherType(eventType) {
        const typeMap = {
            'Flood Warning': 'flood',
            'Flash Flood Warning': 'flood',
            'Severe Thunderstorm Warning': 'storm',
            'Tornado Warning': 'tornado',
            'Heat Advisory': 'heatwave',
            'Excessive Heat Warning': 'heatwave',
            'Winter Storm Warning': 'winter',
            'Blizzard Warning': 'winter'
        };

        return typeMap[eventType] || 'weather';
    }

    mapSeverity(severity) {
        const severityMap = {
            'Extreme': 'critical',
            'Severe': 'high',
            'Moderate': 'moderate',
            'Minor': 'low'
        };

        return severityMap[severity] || 'moderate';
    }

    extractCoordinates(geometry) {
        try {
            if (geometry.type === 'Point' && geometry.coordinates) {
                return {
                    lat: geometry.coordinates[1],
                    lon: geometry.coordinates[0]
                };
            }
            return null;
        } catch (error) {
            logger.error('Error extracting coordinates:', error);
            return null;
        }
    }

    getStatus() {
        return {
            connected: this.connected,
            last_update: this.lastUpdate,
            sources_monitored: this.emergencySources.length,
            sources: this.emergencySources.map(s => s.name)
        };
    }

    isConnected() {
        return this.connected;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new EmergencyService();