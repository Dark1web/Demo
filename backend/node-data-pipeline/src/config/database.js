const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.connected = false;
    }

    connectToSupabase() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
            logger.warn("⚠️ Supabase credentials not configured - using mock database");
            this.supabase = this.createMockSupabase();
            this.connected = true;
            return;
        }

        try {
            this.supabase = createClient(supabaseUrl, supabaseKey);
            this.connected = true;
            logger.info("✅ Connected to Supabase");
        } catch (error) {
            logger.error("❌ Failed to connect to Supabase:", error);
            this.supabase = this.createMockSupabase();
            this.connected = true;
        }
    }

    createMockSupabase() {
        return {
            from: (table) => ({
                select: () => ({ eq: () => ({ execute: () => Promise.resolve({ data: [] }) }) }),
                insert: (data) => ({ execute: () => Promise.resolve({ data: data }) }),
                update: (data) => ({ eq: () => ({ execute: () => Promise.resolve({ data: data }) }) }),
                delete: () => ({ eq: () => ({ execute: () => Promise.resolve({ data: [] }) }) })
            }),
            auth: {
                signUp: () => Promise.resolve({ user: { id: 'mock_user_id' } }),
                signInWithPassword: () => Promise.resolve({ user: { id: 'mock_user_id' } }),
                signOut: () => Promise.resolve()
            }
        };
    }

    async storeWeatherData(data) {
        try {
            if (!this.connected) {
                logger.warn("Database not connected, skipping weather data storage");
                return;
            }
            
            const { data: result, error } = await this.supabase
                .from('weather_data')
                .insert([data])
                .execute();

            if (error) {
                logger.error("Error storing weather data:", error);
            } else {
                logger.info("✅ Weather data stored successfully");
            }
        } catch (error) {
            logger.error("Error storing weather data:", error);
        }
    }

    async storeSocialMediaData(data) {
        try {
            if (!this.connected) {
                logger.warn("Database not connected, skipping social media data storage");
                return;
            }
            
            const { data: result, error } = await this.supabase
                .from('social_media_posts')
                .insert(data)
                .execute();

            if (error) {
                logger.error("Error storing social media data:", error);
            } else {
                logger.info("✅ Social media data stored successfully");
            }
        } catch (error) {
            logger.error("Error storing social media data:", error);
        }
    }

    async storeNewsData(data) {
        try {
            if (!this.connected) {
                logger.warn("Database not connected, skipping news data storage");
                return;
            }
            
            const { data: result, error } = await this.supabase
                .from('news_articles')
                .insert(data)
                .execute();

            if (error) {
                logger.error("Error storing news data:", error);
            } else {
                logger.info("✅ News data stored successfully");
            }
        } catch (error) {
            logger.error("Error storing news data:", error);
        }
    }

    async storeEmergencyData(data) {
        try {
            if (!this.connected) {
                logger.warn("Database not connected, skipping emergency data storage");
                return;
            }
            
            const { data: result, error } = await this.supabase
                .from('emergency_alerts')
                .insert(data)
                .execute();

            if (error) {
                logger.error("Error storing emergency data:", error);
            } else {
                logger.info("✅ Emergency data stored successfully");
            }
        } catch (error) {
            logger.error("Error storing emergency data:", error);
        }
    }

    getStatus() {
        return {
            connected: this.connected,
            type: this.connected ? 'supabase' : 'mock'
        };
    }
}

// Global database manager instance
const databaseManager = new DatabaseManager();

// Initialize connection
function connectToSupabase() {
    databaseManager.connectToSupabase();
}

module.exports = {
    databaseManager,
    connectToSupabase
};