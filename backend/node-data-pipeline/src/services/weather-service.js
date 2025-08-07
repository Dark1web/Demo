const axios = require('axios');
const logger = require('../utils/logger');
const { storeWeatherData, logDataCollection } = require('../config/database');

class WeatherService {
    constructor() {
        this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
        this.weatherApiKey = process.env.WEATHER_API_KEY;
        this.connected = false;
        this.lastUpdate = null;
        this.locations = [
            { name: 'New York', lat: 40.7128, lon: -74.0060 },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
            { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
            { name: 'Houston', lat: 29.7604, lon: -95.3698 },
            { name: 'Miami', lat: 25.7617, lon: -80.1918 }
        ];
    }

    async initialize() {
        try {
            if (!this.openWeatherApiKey) {
                logger.warn('⚠️ OpenWeatherMap API key not provided');
                return;
            }

            // Test API connection
            await this.testConnection();
            this.connected = true;
            logger.info('✅ Weather service initialized');

        } catch (error) {
            logger.error('❌ Failed to initialize weather service:', error);
            this.connected = false;
            throw error;
        }
    }

    async testConnection() {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=${this.openWeatherApiKey}`,
                { timeout: 10000 }
            );

            if (response.status === 200) {
                logger.info('✅ OpenWeatherMap API connection successful');
                return true;
            }
        } catch (error) {
            logger.error('❌ OpenWeatherMap API connection failed:', error.message);
            throw error;
        }
    }

    async collectLatestData() {
        try {
            const weatherData = [];

            for (const location of this.locations) {
                // Get current weather
                const currentWeather = await this.getCurrentWeather(location);
                if (currentWeather) {
                    weatherData.push(currentWeather);
                }

                // Get forecast data
                const forecast = await this.getForecast(location);
                if (forecast) {
                    weatherData.push(...forecast);
                }

                // Small delay to avoid rate limiting
                await this.delay(100);
            }

            // Store in database
            if (weatherData.length > 0) {
                await storeWeatherData(weatherData);
                await logDataCollection('weather', 'success', weatherData.length);
            }

            this.lastUpdate = new Date();
            return weatherData;

        } catch (error) {
            logger.error('Error collecting weather data:', error);
            await logDataCollection('weather', 'error', 0, { error: error.message });
            throw error;
        }
    }

    async getCurrentWeather(location) {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather`,
                {
                    params: {
                        lat: location.lat,
                        lon: location.lon,
                        appid: this.openWeatherApiKey,
                        units: 'metric'
                    },
                    timeout: 10000
                }
            );

            const data = response.data;
            
            return {
                id: `weather_${location.name}_${Date.now()}`,
                source: 'openweathermap',
                type: 'current_weather',
                location: location.name,
                coordinates: {
                    lat: location.lat,
                    lon: location.lon
                },
                temperature: data.main.temp,
                feels_like: data.main.feels_like,
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                wind_speed: data.wind?.speed || 0,
                wind_direction: data.wind?.deg || 0,
                weather_condition: data.weather[0]?.main || 'Unknown',
                weather_description: data.weather[0]?.description || 'No description',
                visibility: data.visibility || 0,
                cloudiness: data.clouds?.all || 0,
                rainfall_1h: data.rain?.['1h'] || 0,
                rainfall_3h: data.rain?.['3h'] || 0,
                snowfall_1h: data.snow?.['1h'] || 0,
                severity: this.assessSeverity(data),
                disaster_related: this.isDisasterRelated(data),
                created_at: new Date().toISOString(),
                raw_data: data
            };

        } catch (error) {
            logger.error(`Error getting current weather for ${location.name}:`, error.message);
            return null;
        }
    }

    async getForecast(location) {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast`,
                {
                    params: {
                        lat: location.lat,
                        lon: location.lon,
                        appid: this.openWeatherApiKey,
                        units: 'metric'
                    },
                    timeout: 10000
                }
            );

            const data = response.data;
            const forecastData = [];

            // Process next 24 hours (8 data points, every 3 hours)
            for (let i = 0; i < Math.min(8, data.list.length); i++) {
                const forecast = data.list[i];
                
                forecastData.push({
                    id: `forecast_${location.name}_${forecast.dt}`,
                    source: 'openweathermap',
                    type: 'forecast',
                    location: location.name,
                    coordinates: {
                        lat: location.lat,
                        lon: location.lon
                    },
                    forecast_time: new Date(forecast.dt * 1000).toISOString(),
                    temperature: forecast.main.temp,
                    feels_like: forecast.main.feels_like,
                    humidity: forecast.main.humidity,
                    pressure: forecast.main.pressure,
                    wind_speed: forecast.wind?.speed || 0,
                    wind_direction: forecast.wind?.deg || 0,
                    weather_condition: forecast.weather[0]?.main || 'Unknown',
                    weather_description: forecast.weather[0]?.description || 'No description',
                    cloudiness: forecast.clouds?.all || 0,
                    rainfall_3h: forecast.rain?.['3h'] || 0,
                    snowfall_3h: forecast.snow?.['3h'] || 0,
                    pop: forecast.pop || 0, // Probability of precipitation
                    severity: this.assessSeverity(forecast),
                    disaster_related: this.isDisasterRelated(forecast),
                    created_at: new Date().toISOString(),
                    raw_data: forecast
                });
            }

            return forecastData;

        } catch (error) {
            logger.error(`Error getting forecast for ${location.name}:`, error.message);
            return [];
        }
    }

    assessSeverity(weatherData) {
        // Assess weather severity based on various factors
        let severity = 'low';

        const temp = weatherData.main?.temp || 0;
        const windSpeed = weatherData.wind?.speed || 0;
        const rainfall = weatherData.rain?.['1h'] || weatherData.rain?.['3h'] || 0;
        const condition = weatherData.weather?.[0]?.main?.toLowerCase() || '';

        // Temperature extremes
        if (temp > 40 || temp < -20) {
            severity = 'critical';
        } else if (temp > 35 || temp < -10) {
            severity = 'high';
        } else if (temp > 30 || temp < 0) {
            severity = 'moderate';
        }

        // High winds
        if (windSpeed > 25) {
            severity = 'critical';
        } else if (windSpeed > 15) {
            severity = 'high';
        } else if (windSpeed > 10) {
            severity = 'moderate';
        }

        // Heavy precipitation
        if (rainfall > 50) {
            severity = 'critical';
        } else if (rainfall > 20) {
            severity = 'high';
        } else if (rainfall > 10) {
            severity = 'moderate';
        }

        // Severe weather conditions
        if (['thunderstorm', 'tornado', 'hurricane'].some(cond => condition.includes(cond))) {
            severity = 'critical';
        } else if (['snow', 'sleet', 'hail'].some(cond => condition.includes(cond))) {
            severity = severity === 'low' ? 'moderate' : severity;
        }

        return severity;
    }

    isDisasterRelated(weatherData) {
        const condition = weatherData.weather?.[0]?.main?.toLowerCase() || '';
        const description = weatherData.weather?.[0]?.description?.toLowerCase() || '';
        const temp = weatherData.main?.temp || 0;
        const windSpeed = weatherData.wind?.speed || 0;
        const rainfall = weatherData.rain?.['1h'] || weatherData.rain?.['3h'] || 0;

        // Check for disaster-related conditions
        const disasterConditions = [
            'thunderstorm', 'tornado', 'hurricane', 'cyclone',
            'extreme', 'severe', 'heavy', 'intense'
        ];

        const hasDisasterCondition = disasterConditions.some(cond => 
            condition.includes(cond) || description.includes(cond)
        );

        const hasExtremeValues = temp > 40 || temp < -20 || windSpeed > 20 || rainfall > 25;

        return hasDisasterCondition || hasExtremeValues;
    }

    async getHistoricalData(location, days = 7) {
        // Implementation for historical weather data
        // This would require a different API endpoint or service
        logger.info(`Getting historical weather data for ${location.name} (${days} days)`);
        return [];
    }

    async getWeatherAlerts() {
        try {
            // Get weather alerts from various sources
            const alerts = [];
            
            // This could integrate with:
            // - National Weather Service
            // - Weather.gov API
            // - NOAA alerts
            // - Local weather services

            return alerts;

        } catch (error) {
            logger.error('Error getting weather alerts:', error);
            return [];
        }
    }

    getStatus() {
        return {
            connected: this.connected,
            last_update: this.lastUpdate,
            locations_monitored: this.locations.length,
            api_keys_configured: {
                openweather: !!this.openWeatherApiKey,
                weather_api: !!this.weatherApiKey
            }
        };
    }

    isConnected() {
        return this.connected;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new WeatherService();