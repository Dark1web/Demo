const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dashboard_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// WebSocket connections
const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.url.split('/').pop();
  clients.set(userId, ws);
  
  console.log(`Client connected: ${userId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(userId, data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(userId);
    console.log(`Client disconnected: ${userId}`);
  });
});

function handleWebSocketMessage(userId, data) {
  switch (data.type) {
    case 'location_update':
      broadcastLocationUpdate(userId, data);
      break;
    case 'dashboard_update':
      broadcastDashboardUpdate(userId, data);
      break;
    case 'map_search':
      handleMapSearch(userId, data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

function broadcastLocationUpdate(userId, data) {
  const message = JSON.stringify({
    type: 'location_update',
    userId: userId,
    data: data
  });
  
  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastDashboardUpdate(userId, data) {
  const message = JSON.stringify({
    type: 'dashboard_update',
    userId: userId,
    data: data
  });
  
  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function handleMapSearch(userId, data) {
  try {
    const { query } = data;
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );
    
    const results = response.data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type
    }));
    
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'map_search_results',
        results: results
      }));
    }
  } catch (error) {
    console.error('Error searching map:', error);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/map/search', async (req, res) => {
  try {
    const { query } = req.body;
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10`
    );
    
    const results = response.data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type
    }));
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/map/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    
    res.json({
      address: response.data.display_name,
      details: response.data.address
    });
  } catch (error) {
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
});

// Real-time data endpoints
app.post('/api/realtime/metrics', async (req, res) => {
  try {
    const { userId, metrics } = req.body;
    
    // Store metrics in database
    const query = `
      INSERT INTO realtime_metrics (user_id, metrics_data, created_at)
      VALUES ($1, $2, NOW())
    `;
    await pool.query(query, [userId, JSON.stringify(metrics)]);
    
    // Broadcast to connected clients
    const message = JSON.stringify({
      type: 'metrics_update',
      userId: userId,
      metrics: metrics,
      timestamp: new Date().toISOString()
    });
    
    clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
});

app.get('/api/realtime/metrics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT metrics_data, created_at
      FROM realtime_metrics
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [userId]);
    const metrics = result.rows.map(row => ({
      data: row.metrics_data,
      timestamp: row.created_at
    }));
    
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GPS location tracking
app.post('/api/gps/track', async (req, res) => {
  try {
    const { userId, latitude, longitude, accuracy, timestamp } = req.body;
    
    // Store GPS data
    const query = `
      INSERT INTO gps_tracking (user_id, latitude, longitude, accuracy, timestamp)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [userId, latitude, longitude, accuracy, timestamp]);
    
    // Broadcast location update
    const message = JSON.stringify({
      type: 'gps_update',
      userId: userId,
      latitude: latitude,
      longitude: longitude,
      accuracy: accuracy,
      timestamp: timestamp
    });
    
    clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking GPS:', error);
    res.status(500).json({ error: 'Failed to track GPS' });
  }
});

app.get('/api/gps/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT latitude, longitude, accuracy, timestamp
      FROM gps_tracking
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({ locations: result.rows });
  } catch (error) {
    console.error('Error fetching GPS history:', error);
    res.status(500).json({ error: 'Failed to fetch GPS history' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Node.js server running on port ${PORT}`);
});