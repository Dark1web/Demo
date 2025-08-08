import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  MapPin, 
  Clock,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

interface Metric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

const MetricsPanel: React.FC = () => {
  const { user } = useAuth();
  const { realTimeMetrics, locationData } = useWebSocket();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [chartData, setChartData] = useState<any>({});

  useEffect(() => {
    // Generate sample metrics based on real-time data
    const generateMetrics = () => {
      const totalUsers = Math.floor(Math.random() * 100) + 50;
      const activeUsers = Math.floor(Math.random() * 30) + 10;
      const totalLocations = locationData.length;
      const avgResponseTime = Math.floor(Math.random() * 200) + 50;

      setMetrics([
        {
          id: 'users',
          title: 'Total Users',
          value: totalUsers,
          change: Math.floor(Math.random() * 20) + 5,
          changeType: 'increase',
          icon: <Users className="w-6 h-6" />,
          color: 'bg-blue-500'
        },
        {
          id: 'active',
          title: 'Active Users',
          value: activeUsers,
          change: Math.floor(Math.random() * 15) + 3,
          changeType: 'increase',
          icon: <Activity className="w-6 h-6" />,
          color: 'bg-green-500'
        },
        {
          id: 'locations',
          title: 'Location Updates',
          value: totalLocations,
          change: Math.floor(Math.random() * 10) + 2,
          changeType: 'increase',
          icon: <MapPin className="w-6 h-6" />,
          color: 'bg-purple-500'
        },
        {
          id: 'response',
          title: 'Avg Response Time',
          value: avgResponseTime,
          change: Math.floor(Math.random() * 50) + 10,
          changeType: 'decrease',
          icon: <Clock className="w-6 h-6" />,
          color: 'bg-orange-500'
        }
      ]);
    };

    generateMetrics();
    const interval = setInterval(generateMetrics, 5000);

    return () => clearInterval(interval);
  }, [locationData]);

  useEffect(() => {
    // Generate chart data
    const generateChartData = () => {
      const now = new Date();
      const labels = [];
      const data = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(Math.floor(Math.random() * 100) + 20);
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Active Users',
            data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }
        ]
      });
    };

    generateChartData();
    const interval = setInterval(generateChartData, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Real-time metrics and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live updates</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {metric.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last week</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center text-white`}>
                {metric.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400">Using Chart.js or Recharts</p>
            </div>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Location Distribution</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-500">Location analytics</p>
              <p className="text-sm text-gray-400">Interactive pie chart</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {locationData.slice(0, 5).map((location: any, index: number) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Location update from {location.email || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {location.timestamp ? new Date(location.timestamp).toLocaleTimeString() : 'Now'}
                </div>
              </div>
            ))}
            {locationData.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Location updates will appear here</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Real-time Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">System Status</h3>
            <p className="text-blue-100">All systems operational</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{metrics.reduce((sum, m) => sum + m.value, 0)}</div>
            <div className="text-blue-100 text-sm">Total metrics</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MetricsPanel;