import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  MapPin, 
  User, 
  Clock, 
  Bell, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface ActivityItem {
  id: string;
  type: 'location' | 'user' | 'system' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  icon: React.ReactNode;
  color: string;
}

const ActivityFeed: React.FC = () => {
  const { locationData, dashboardData } = useWebSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'location' | 'user' | 'system' | 'alert'>('all');

  useEffect(() => {
    // Generate activities from real-time data
    const generateActivities = () => {
      const newActivities: ActivityItem[] = [];

      // Location updates
      locationData.slice(0, 3).forEach((location: any, index: number) => {
        newActivities.push({
          id: `location-${index}`,
          type: 'location',
          title: 'Location Update',
          description: `New location recorded at ${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`,
          timestamp: location.timestamp || new Date().toISOString(),
          user: location.email || 'Unknown User',
          icon: <MapPin className="w-4 h-4" />,
          color: 'text-blue-600'
        });
      });

      // System activities
      const systemActivities = [
        {
          id: 'system-1',
          type: 'system' as const,
          title: 'System Update',
          description: 'Real-time data pipeline optimized',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          icon: <Activity className="w-4 h-4" />,
          color: 'text-green-600'
        },
        {
          id: 'system-2',
          type: 'system' as const,
          title: 'Database Sync',
          description: 'Location data synchronized successfully',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-purple-600'
        }
      ];

      newActivities.push(...systemActivities);

      // User activities
      const userActivities = [
        {
          id: 'user-1',
          type: 'user' as const,
          title: 'User Login',
          description: 'User logged in from new device',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          user: 'john@example.com',
          icon: <User className="w-4 h-4" />,
          color: 'text-orange-600'
        }
      ];

      newActivities.push(...userActivities);

      // Alerts
      if (Math.random() > 0.7) {
        newActivities.push({
          id: 'alert-1',
          type: 'alert',
          title: 'High Activity Alert',
          description: 'Unusual number of location updates detected',
          timestamp: new Date().toISOString(),
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-red-600'
        });
      }

      setActivities(newActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    generateActivities();
    const interval = setInterval(generateActivities, 8000);

    return () => clearInterval(interval);
  }, [locationData, dashboardData]);

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  const getFilterCount = (type: string) => {
    return activities.filter(activity => activity.type === type).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-gray-600">Real-time updates and notifications</p>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">{activities.length} activities</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All', count: activities.length },
              { key: 'location', label: 'Location', count: getFilterCount('location') },
              { key: 'user', label: 'User', count: getFilterCount('user') },
              { key: 'system', label: 'System', count: getFilterCount('system') },
              { key: 'alert', label: 'Alerts', count: getFilterCount('alert') }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Activity List */}
        <div className="p-6">
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color.replace('text-', 'bg-')} bg-opacity-10`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  {activity.user && (
                    <div className="flex items-center space-x-1 mt-2">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{activity.user}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredActivities.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No activities found</p>
                <p className="text-sm text-gray-400">Activities will appear here as they occur</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Activities', value: activities.length, color: 'bg-blue-500' },
          { label: 'Location Updates', value: getFilterCount('location'), color: 'bg-green-500' },
          { label: 'System Events', value: getFilterCount('system'), color: 'bg-purple-500' },
          { label: 'Alerts', value: getFilterCount('alert'), color: 'bg-red-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                <Activity className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Real-time Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Live Activity Monitor</h3>
            <p className="text-blue-100">Real-time activity tracking active</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{activities.length}</div>
            <div className="text-blue-100 text-sm">Total activities</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivityFeed;