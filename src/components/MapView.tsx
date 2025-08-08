import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Search, Navigation, MapPin, Clock, User } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: number;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  user_id: number;
  email: string;
}

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
}

const MapView: React.FC = () => {
  const { user } = useAuth();
  const { locationData, sendMessage } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const mapRef = useRef<any>(null);

  // Custom marker icons
  const userIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM0RkY1RjUiLz4KPHBhdGggZD0iTTEyIDZDNi40OCA2IDIgMTAuNDggMiAxNkMyIDIxLjUyIDYuNDggMjYgMTIgMjZDNi40OCAyNiAyIDIxLjUyIDIgMTZDNi40OCAxMCAxMiA2IDEyIDZaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const locationIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM0RkY1RjUiLz4KPHBhdGggZD0iTTEyIDZDNi40OCA2IDIgMTAuNDggMiAxNkMyIDIxLjUyIDYuNDggMjYgMTIgMjZDNi40OCAyNiAyIDIxLjUyIDIgMTZDNi40OCAxMCAxMiA2IDEyIDZaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo=',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.post('http://localhost:3001/api/map/search', {
        query: searchQuery
      });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setMapCenter([result.lat, result.lon]);
    setSearchResults([]);
    setSearchQuery('');
  };

  // GPS tracking
  const startTracking = () => {
    if ('geolocation' in navigator) {
      setIsTracking(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          
          // Send location to server
          sendMessage({
            type: 'location_update',
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error('GPS error:', error);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  // Auto-center map when user location changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isTracking
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>{isTracking ? 'Stop Tracking' : 'Start GPS'}</span>
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{result.display_name}</p>
                      <p className="text-xs text-gray-500">{result.type}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-96 w-full">
          <MapContainer
            center={mapCenter as [number, number]}
            zoom={13}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Your Location</h3>
                    <p className="text-sm text-gray-600">
                      {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Real-time GPS tracking</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Location History Markers */}
            {locationData.map((location: Location, index: number) => (
              <Marker
                key={location.id || index}
                position={[location.latitude, location.longitude]}
                icon={locationIcon}
              >
                <Popup>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">{location.email}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    {location.address && (
                      <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                    )}
                    <div className="flex items-center justify-center space-x-1 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {new Date(location.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* GPS Accuracy Circle */}
            {userLocation && isTracking && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={50}
                pathOptions={{
                  color: 'blue',
                  fillColor: 'blue',
                  fillOpacity: 0.1
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Location Info Panel */}
      {selectedLocation && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Latitude</p>
              <p className="text-lg text-gray-900">{selectedLocation.latitude}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Longitude</p>
              <p className="text-lg text-gray-900">{selectedLocation.longitude}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">User</p>
              <p className="text-lg text-gray-900">{selectedLocation.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Timestamp</p>
              <p className="text-lg text-gray-900">
                {new Date(selectedLocation.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Real-time updates active</span>
            </div>
            <div className="text-sm text-gray-500">
              {locationData.length} location updates received
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last update: {locationData.length > 0 ? new Date(locationData[0].timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;