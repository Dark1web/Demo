import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { 
  BarChart3, 
  MapPin, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  Search,
  Navigation,
  Activity,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react';
import MapView from '../components/MapView';
import MetricsPanel from '../components/MetricsPanel';
import ActivityFeed from '../components/ActivityFeed';
import SettingsPanel from '../components/SettingsPanel';
import GPSTracker from '../components/GPSTracker';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, locationData, realTimeMetrics } = useWebSocket();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Maps', href: '/dashboard/maps', icon: MapPin },
    { name: 'Activity', href: '/dashboard/activity', icon: Activity },
    { name: 'GPS Tracking', href: '/dashboard/gps', icon: Navigation },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const currentNav = navigation.find(nav => nav.href === location.pathname) || navigation[0];

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newNotification = {
          id: Date.now(),
          type: 'info',
          message: 'New data update received',
          timestamp: new Date().toISOString()
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Dashboard Pro</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentNav.name}</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<MetricsPanel />} />
            <Route path="/maps" element={<MapView />} />
            <Route path="/activity" element={<ActivityFeed />} />
            <Route path="/gps" element={<GPSTracker />} />
            <Route path="/settings" element={<SettingsPanel />} />
          </Routes>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;