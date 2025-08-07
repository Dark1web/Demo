const axios = require('axios');
const logger = require('../utils/logger');
const { storeSocialMediaData, logDataCollection } = require('../config/database');

class SocialMediaService {
    constructor() {
        this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
        this.mastodonAccessToken = process.env.MASTODON_ACCESS_TOKEN;
        this.mastodonInstance = process.env.MASTODON_INSTANCE || 'mastodon.social';
        this.connected = false;
        this.lastUpdate = null;
        
        // Keywords to monitor for disaster-related content
        this.disasterKeywords = [
            'flood', 'flooding', 'hurricane', 'tornado', 'earthquake', 'wildfire',
            'heatwave', 'blizzard', 'tsunami', 'emergency', 'evacuation', 'disaster',
            'breaking', 'alert', 'warning', 'urgent', 'crisis', 'catastrophe',
            'rescue', 'relief', 'damage', 'destroyed', 'collapsed'
        ];

        // Misinformation indicators
        this.misinfoIndicators = [
            'hoax', 'fake news', 'conspiracy', 'cover-up', 'they dont want you to know',
            'mainstream media lies', 'wake up', 'question everything', 'do your research',
            'false flag', 'crisis actor', 'government plot'
        ];
    }

    async initialize() {
        try {
            logger.info('🔄 Initializing social media monitoring...');
            
            // Test connections
            let anyConnected = false;

            if (this.twitterBearerToken) {
                try {
                    await this.testTwitterConnection();
                    logger.info('✅ Twitter API connected');
                    anyConnected = true;
                } catch (error) {
                    logger.warn('⚠️ Twitter API connection failed:', error.message);
                }
            } else {
                logger.warn('⚠️ Twitter Bearer Token not provided');
            }

            if (this.mastodonAccessToken) {
                try {
                    await this.testMastodonConnection();
                    logger.info('✅ Mastodon API connected');
                    anyConnected = true;
                } catch (error) {
                    logger.warn('⚠️ Mastodon API connection failed:', error.message);
                }
            } else {
                logger.warn('⚠️ Mastodon credentials not provided');
            }

            this.connected = anyConnected;
            
            if (this.connected) {
                logger.info('✅ Social media service initialized');
            } else {
                logger.warn('⚠️ No social media APIs connected - using mock data');
            }

        } catch (error) {
            logger.error('❌ Failed to initialize social media service:', error);
            this.connected = false;
        }
    }

    async testTwitterConnection() {
        if (!this.twitterBearerToken) return false;

        try {
            const response = await axios.get(
                'https://api.twitter.com/2/tweets/search/recent',
                {
                    headers: {
                        'Authorization': `Bearer ${this.twitterBearerToken}`
                    },
                    params: {
                        query: 'flood',
                        max_results: 10
                    },
                    timeout: 10000
                }
            );

            return response.status === 200;

        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Twitter API authentication failed');
            }
            throw error;
        }
    }

    async testMastodonConnection() {
        if (!this.mastodonAccessToken) return false;

        try {
            const response = await axios.get(
                `https://${this.mastodonInstance}/api/v1/accounts/verify_credentials`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.mastodonAccessToken}`
                    },
                    timeout: 10000
                }
            );

            return response.status === 200;

        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Mastodon API authentication failed');
            }
            throw error;
        }
    }

    async collectLatestData() {
        try {
            const socialData = [];

            // Collect from Twitter
            if (this.twitterBearerToken) {
                const twitterData = await this.collectTwitterData();
                socialData.push(...twitterData);
            }

            // Collect from Mastodon
            if (this.mastodonAccessToken) {
                const mastodonData = await this.collectMastodonData();
                socialData.push(...mastodonData);
            }

            // If no real APIs available, generate mock data
            if (!this.connected) {
                const mockData = this.generateMockSocialData();
                socialData.push(...mockData);
            }

            // Process and analyze posts
            const processedData = socialData.map(post => this.analyzePost(post));

            // Store in database
            if (processedData.length > 0) {
                await storeSocialMediaData(processedData);
                await logDataCollection('social_media', 'success', processedData.length);
            }

            this.lastUpdate = new Date();
            return processedData;

        } catch (error) {
            logger.error('Error collecting social media data:', error);
            await logDataCollection('social_media', 'error', 0, { error: error.message });
            throw error;
        }
    }

    async collectTwitterData() {
        try {
            const posts = [];
            
            for (const keyword of this.disasterKeywords.slice(0, 5)) { // Limit to avoid rate limits
                const searchResults = await this.searchTwitter(keyword);
                posts.push(...searchResults);
                
                // Delay to respect rate limits
                await this.delay(1000);
            }

            return posts;

        } catch (error) {
            logger.error('Error collecting Twitter data:', error);
            return [];
        }
    }

    async searchTwitter(query) {
        try {
            const response = await axios.get(
                'https://api.twitter.com/2/tweets/search/recent',
                {
                    headers: {
                        'Authorization': `Bearer ${this.twitterBearerToken}`
                    },
                    params: {
                        query: `${query} -is:retweet lang:en`,
                        max_results: 20,
                        'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,geo',
                        'user.fields': 'public_metrics,verified',
                        'expansions': 'author_id'
                    },
                    timeout: 15000
                }
            );

            const tweets = response.data.data || [];
            const users = response.data.includes?.users || [];
            
            // Create user lookup map
            const userMap = {};
            users.forEach(user => {
                userMap[user.id] = user;
            });

            return tweets.map(tweet => {
                const author = userMap[tweet.author_id];
                
                return {
                    id: `twitter_${tweet.id}`,
                    platform: 'twitter',
                    content: tweet.text,
                    author: author?.username || 'unknown',
                    author_id: tweet.author_id,
                    author_verified: author?.verified || false,
                    author_followers: author?.public_metrics?.followers_count || 0,
                    created_at: tweet.created_at,
                    url: `https://twitter.com/i/web/status/${tweet.id}`,
                    engagement: {
                        likes: tweet.public_metrics?.like_count || 0,
                        retweets: tweet.public_metrics?.retweet_count || 0,
                        replies: tweet.public_metrics?.reply_count || 0,
                        quotes: tweet.public_metrics?.quote_count || 0
                    },
                    location: this.extractLocation(tweet),
                    raw_data: tweet
                };
            });

        } catch (error) {
            logger.error(`Error searching Twitter for "${query}":`, error.message);
            return [];
        }
    }

    async collectMastodonData() {
        try {
            const posts = [];
            
            // Search public timeline for disaster-related content
            for (const keyword of this.disasterKeywords.slice(0, 3)) {
                const searchResults = await this.searchMastodon(keyword);
                posts.push(...searchResults);
                
                await this.delay(500);
            }

            return posts;

        } catch (error) {
            logger.error('Error collecting Mastodon data:', error);
            return [];
        }
    }

    async searchMastodon(query) {
        try {
            const response = await axios.get(
                `https://${this.mastodonInstance}/api/v2/search`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.mastodonAccessToken}`
                    },
                    params: {
                        q: query,
                        type: 'statuses',
                        limit: 20,
                        resolve: false
                    },
                    timeout: 15000
                }
            );

            const statuses = response.data.statuses || [];

            return statuses.map(status => ({
                id: `mastodon_${status.id}`,
                platform: 'mastodon',
                content: this.stripHtml(status.content),
                author: status.account?.username || 'unknown',
                author_id: status.account?.id,
                author_verified: status.account?.bot === false,
                author_followers: status.account?.followers_count || 0,
                created_at: status.created_at,
                url: status.url,
                engagement: {
                    likes: status.favourites_count || 0,
                    retweets: status.reblogs_count || 0,
                    replies: status.replies_count || 0
                },
                location: null, // Mastodon typically doesn't include location
                raw_data: status
            }));

        } catch (error) {
            logger.error(`Error searching Mastodon for "${query}":`, error.message);
            return [];
        }
    }

    generateMockSocialData() {
        const mockPosts = [
            {
                id: `mock_${Date.now()}_1`,
                platform: 'twitter',
                content: 'Flash flood warning in downtown area! Everyone stay safe and avoid low-lying roads. #FloodAlert #Safety',
                author: 'local_weather_bot',
                author_verified: true,
                author_followers: 15000,
                created_at: new Date().toISOString(),
                url: 'https://twitter.com/mock/status/123',
                engagement: { likes: 45, retweets: 23, replies: 8 },
                location: 'Downtown District'
            },
            {
                id: `mock_${Date.now()}_2`,
                platform: 'mastodon',
                content: 'Government is hiding the truth about these weather patterns! Wake up people! #WeatherConspiracy',
                author: 'truth_seeker_99',
                author_verified: false,
                author_followers: 200,
                created_at: new Date(Date.now() - 30000).toISOString(),
                url: 'https://mastodon.social/mock/status/456',
                engagement: { likes: 3, retweets: 1, replies: 12 },
                location: null
            },
            {
                id: `mock_${Date.now()}_3`,
                platform: 'twitter',
                content: 'Extreme heat warning for next 3 days. Temperature expected to reach 42°C. Stay hydrated! Official alert from @NationalWeatherService',
                author: 'emergency_alerts',
                author_verified: true,
                author_followers: 50000,
                created_at: new Date(Date.now() - 60000).toISOString(),
                url: 'https://twitter.com/mock/status/789',
                engagement: { likes: 156, retweets: 89, replies: 23 },
                location: 'Metropolitan Area'
            }
        ];

        return mockPosts;
    }

    analyzePost(post) {
        // Add analysis fields to the post
        const analyzed = {
            ...post,
            disaster_related: this.isDisasterRelated(post.content),
            misinformation_risk: this.calculateMisinformationRisk(post),
            sentiment: this.analyzeSentiment(post.content),
            urgency_level: this.assessUrgency(post.content),
            geographic_relevance: this.extractGeographicInfo(post.content),
            hours_since_post: this.calculateHoursSincePost(post.created_at),
            processed_at: new Date().toISOString()
        };

        return analyzed;
    }

    isDisasterRelated(content) {
        const contentLower = content.toLowerCase();
        return this.disasterKeywords.some(keyword => contentLower.includes(keyword));
    }

    calculateMisinformationRisk(post) {
        let riskScore = 0;
        const contentLower = post.content.toLowerCase();

        // Check for misinformation indicators
        this.misinfoIndicators.forEach(indicator => {
            if (contentLower.includes(indicator)) {
                riskScore += 20;
            }
        });

        // Check account credibility
        if (!post.author_verified) riskScore += 10;
        if (post.author_followers < 100) riskScore += 15;

        // Check for emotional manipulation words
        const emotionalWords = ['shocking', 'unbelievable', 'must see', 'they dont want', 'hidden truth'];
        emotionalWords.forEach(word => {
            if (contentLower.includes(word)) riskScore += 10;
        });

        // Check engagement patterns
        if (post.engagement) {
            const { likes, retweets, replies } = post.engagement;
            const totalEngagement = likes + retweets + replies;
            
            // Suspicious if low engagement but high share ratio
            if (totalEngagement > 0 && retweets / totalEngagement > 0.7) {
                riskScore += 15;
            }
        }

        return Math.min(riskScore, 100); // Cap at 100
    }

    analyzeSentiment(content) {
        // Simple sentiment analysis based on keywords
        const positiveWords = ['safe', 'help', 'rescue', 'relief', 'support', 'recovery'];
        const negativeWords = ['disaster', 'destroy', 'death', 'damage', 'crisis', 'emergency'];
        const fearWords = ['terrifying', 'catastrophic', 'devastating', 'apocalyptic'];

        const contentLower = content.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        let fearCount = 0;

        positiveWords.forEach(word => {
            if (contentLower.includes(word)) positiveCount++;
        });

        negativeWords.forEach(word => {
            if (contentLower.includes(word)) negativeCount++;
        });

        fearWords.forEach(word => {
            if (contentLower.includes(word)) fearCount++;
        });

        if (fearCount > 0) return 'fear';
        if (negativeCount > positiveCount) return 'negative';
        if (positiveCount > negativeCount) return 'positive';
        return 'neutral';
    }

    assessUrgency(content) {
        const urgentWords = ['urgent', 'immediate', 'emergency', 'breaking', 'alert', 'warning', 'evacuate'];
        const contentLower = content.toLowerCase();
        
        const urgentMatches = urgentWords.filter(word => contentLower.includes(word)).length;
        
        if (urgentMatches >= 3) return 'critical';
        if (urgentMatches >= 2) return 'high';
        if (urgentMatches >= 1) return 'moderate';
        return 'low';
    }

    extractGeographicInfo(content) {
        // Simple geographic extraction (in real implementation, use NER)
        const locations = ['downtown', 'suburb', 'city center', 'north side', 'south side', 'east side', 'west side'];
        const contentLower = content.toLowerCase();
        
        const foundLocations = locations.filter(location => contentLower.includes(location));
        return foundLocations.length > 0 ? foundLocations : null;
    }

    extractLocation(tweet) {
        // Extract location from Twitter geo data or content
        if (tweet.geo) {
            return tweet.geo.place_id || 'geo_tagged';
        }
        return null;
    }

    calculateHoursSincePost(createdAt) {
        const postTime = new Date(createdAt);
        const now = new Date();
        return (now - postTime) / (1000 * 60 * 60); // Convert to hours
    }

    stripHtml(html) {
        // Remove HTML tags from Mastodon content
        return html.replace(/<[^>]*>/g, '');
    }

    getStatus() {
        return {
            connected: this.connected,
            last_update: this.lastUpdate,
            platforms: {
                twitter: !!this.twitterBearerToken,
                mastodon: !!this.mastodonAccessToken
            },
            keywords_monitored: this.disasterKeywords.length,
            misinformation_indicators: this.misinfoIndicators.length
        };
    }

    isConnected() {
        return this.connected;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new SocialMediaService();