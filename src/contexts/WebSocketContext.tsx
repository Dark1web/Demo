import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  locationData: any[];
  dashboardData: any[];
  realTimeMetrics: any;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>({});

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    const wsUrl = `ws://localhost:8000/ws/${user.id}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, [user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'location_update':
        setLocationData(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 updates
        break;
      
      case 'dashboard_update':
        setDashboardData(prev => [data, ...prev.slice(0, 99)]);
        break;
      
      case 'metrics_update':
        setRealTimeMetrics(data.metrics);
        break;
      
      case 'gps_update':
        // Handle GPS updates
        setLocationData(prev => [{
          type: 'gps',
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp
        }, ...prev.slice(0, 99)]);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  const value = {
    isConnected,
    sendMessage,
    locationData,
    dashboardData,
    realTimeMetrics
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};