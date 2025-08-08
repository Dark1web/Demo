import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Activity, 
  Play, 
  Pause,
  RefreshCw,
  Download,
  Trash2,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import axios from 'axios';

interface GPSLocation {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

const GPSTracker: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<GPSLocation[]>([]);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Start GPS tracking
  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      setError('GPS is not supported in this browser');
      return;
    }

    setIsTracking(true);
    setError('');

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location: GPSLocation = {
          id: Date.now(),
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        };

        setCurrentLocation(location);
        setAccuracy(accuracy);

        // Send to server
        sendMessage({
          type: 'location_update',
          latitude,
          longitude,
          accuracy,
          timestamp: location.timestamp
        });

        // Start continuous tracking
        const interval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              const newLocation: GPSLocation = {
                id: Date.now(),
                latitude,
                longitude,
                accuracy,
                timestamp: new Date().toISOString()
              };

              setCurrentLocation(newLocation);
              setAccuracy(accuracy);
              setLocationHistory(prev => [newLocation, ...prev.slice(0, 99)]);

              // Send to server
              sendMessage({
                type: 'location_update',
                latitude,
                longitude,
                accuracy,
                timestamp: newLocation.timestamp
              });
            },
            (err) => {
              console.error('GPS error:', err);
              setError('Failed to get location');
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 30000
            }
          );
        }, 5000); // Update every 5 seconds

        setTrackingInterval(interval);
      },
      (err) => {
        console.error('GPS error:', err);
        setError('Failed to get initial location');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Stop GPS tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
  };

  // Clear location history
  const clearHistory = () => {
    setLocationHistory([]);
  };

  // Export location data
  const exportData = () => {
    const data = {
      user: user?.email,
      exportDate: new Date().toISOString(),
      locations: locationHistory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load location history from server
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/gps/history/${user?.id}`);
        setLocationHistory(response.data.locations || []);
      } catch (error) {
        console.error('Failed to load GPS history:', error);
      }
    };

    if (user) {
      loadHistory();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GPS Tracker</h1>
          <p className="text-gray-600">Real-time location tracking and history</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
          </span>
        </div>
      </div>

      {/* Current Location */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Location</h2>
          <div className="flex items-center space-x-2">
            {isTracking ? (
              <button
                onClick={stopTracking}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Tracking</span>
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Tracking</span>
              </button>
            )}
          </div>
        </div>

        {currentLocation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Coordinates</span>
              </div>
              <p className="text-lg font-mono text-gray-900">
                {currentLocation.latitude.toFixed(6)}
              </p>
              <p className="text-lg font-mono text-gray-900">
                {currentLocation.longitude.toFixed(6)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Accuracy</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                ±{accuracy.toFixed(1)}m
              </p>
              <p className="text-sm text-gray-500">
                {accuracy < 10 ? 'High' : accuracy < 50 ? 'Medium' : 'Low'} accuracy
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Last Update</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(currentLocation.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No location data</p>
            <p className="text-sm text-gray-400">Start tracking to see your current location</p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Location History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Location History</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={clearHistory}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {locationHistory.slice(0, 10).map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Accuracy: ±{location.accuracy.toFixed(1)}m
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {new Date(location.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(location.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}

            {locationHistory.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No location history</p>
                <p className="text-sm text-gray-400">Location history will appear here when tracking</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tracking Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            label: 'Total Locations',
            value: locationHistory.length,
            icon: <MapPin className="w-5 h-5" />,
            color: 'bg-blue-500'
          },
          {
            label: 'Tracking Time',
            value: isTracking ? 'Active' : 'Inactive',
            icon: <Activity className="w-5 h-5" />,
            color: 'bg-green-500'
          },
          {
            label: 'Avg Accuracy',
            value: locationHistory.length > 0 
              ? `±${(locationHistory.reduce((sum, loc) => sum + loc.accuracy, 0) / locationHistory.length).toFixed(1)}m`
              : 'N/A',
            icon: <Settings className="w-5 h-5" />,
            color: 'bg-purple-500'
          }
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default GPSTracker;