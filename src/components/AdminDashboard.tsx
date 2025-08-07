import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  AlertTriangle, 
  Users, 
  Shield, 
  TrendingUp, 
  Activity,
  Bell,
  Settings,
  Download,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  BarChart3
} from 'lucide-react';
import Earth3D from './Earth3D';
// Chart dependencies temporarily removed - using simple visualizations

interface AdminDashboardProps {
  user: any;
  onSignOut: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    activeAlerts: 12,
    totalUsers: 1247,
    misinfoDetected: 45,
    systemHealth: 99.8,
    responseTime: 28
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeAlerts: prev.activeAlerts + Math.floor(Math.random() * 3) - 1,
        misinfoDetected: prev.misinfoDetected + Math.floor(Math.random() * 2),
        responseTime: Math.max(20, prev.responseTime + Math.floor(Math.random() * 6) - 3)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sample data for visualizations

  const recentAlerts = [
    { id: 1, type: 'Flood', location: 'Manila, Philippines', severity: 'High', time: '2 min ago', status: 'Active' },
    { id: 2, type: 'Earthquake', location: 'Tokyo, Japan', severity: 'Medium', time: '15 min ago', status: 'Monitoring' },
    { id: 3, type: 'Storm', location: 'Miami, USA', severity: 'Critical', time: '1 hour ago', status: 'Active' },
    { id: 4, type: 'Fire', location: 'Sydney, Australia', severity: 'High', time: '2 hours ago', status: 'Contained' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Globe className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Aegis Vision Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-white border-white/30">
                {user.email}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white border-white/30 hover:bg-white/10"
                onClick={onSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-lg">
            <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
            <TabsTrigger value="globe" className="text-white">Global View</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
            <TabsTrigger value="management" className="text-white">Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Active Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{realTimeData.activeAlerts}</div>
                    <p className="text-xs text-gray-300">+2 from yesterday</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{realTimeData.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-gray-300">+12% from last month</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Misinformation</CardTitle>
                    <Shield className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{realTimeData.misinfoDetected}</div>
                    <p className="text-xs text-gray-300">Detected today</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">System Health</CardTitle>
                    <Activity className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{realTimeData.systemHealth}%</div>
                    <p className="text-xs text-gray-300">All systems operational</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{realTimeData.responseTime}s</div>
                    <p className="text-xs text-gray-300">Average response</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Alerts
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest disaster alerts and incidents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                          <div>
                            <p className="text-white font-medium">{alert.type}</p>
                            <p className="text-gray-400 text-sm">{alert.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {alert.status}
                          </Badge>
                          <p className="text-gray-400 text-xs mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Alert Trends</CardTitle>
                  <CardDescription className="text-gray-300">
                    Weekly alert and misinformation trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                      <p className="text-lg font-semibold mb-2">Alert Trends</p>
                      <p className="text-sm text-gray-300 max-w-xs">
                        Weekly trends show a 15% increase in alert volume with improved response times
                      </p>
                      <div className="mt-4 flex justify-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Alerts</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>Misinformation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Globe Tab */}
          <TabsContent value="globe" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Disaster Monitoring
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Real-time 3D visualization of global disaster events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <color attach="background" args={['#0f0f23']} />
                    <Earth3D autoRotate={false} />
                    <OrbitControls 
                      enableZoom={true} 
                      enablePan={true}
                      autoRotate={false}
                    />
                  </Canvas>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Disaster Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🌊</span>
                          </div>
                          <p className="text-sm">Floods (30%)</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🌍</span>
                          </div>
                          <p className="text-sm">Earthquakes (20%)</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🔥</span>
                          </div>
                          <p className="text-sm">Fires (25%)</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">⛈️</span>
                          </div>
                          <p className="text-sm">Storms (25%)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Regional Alert Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-800 rounded-lg p-4">
                    <div className="space-y-3">
                      {['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'].map((region, index) => {
                        const values = [25, 18, 35, 12, 22, 8];
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500', 'bg-indigo-500'];
                        return (
                          <div key={region} className="flex items-center justify-between text-white">
                            <span className="text-sm w-24">{region}</span>
                            <div className="flex-1 mx-4 bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${colors[index]}`}
                                style={{ width: `${(values[index] / 35) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm w-8 text-right">{values[index]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data Sources
                  </Button>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" />
                    Export Reports
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Filter className="mr-2 h-4 w-4" />
                    Configure Filters
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription className="text-white">
                      All monitoring systems are operational
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-white">
                      <span>API Response Time</span>
                      <span className="text-green-400">28ms</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Database Latency</span>
                      <span className="text-green-400">12ms</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>WebSocket Connections</span>
                      <span className="text-blue-400">1,247</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;