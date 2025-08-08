import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  AlertTriangle, 
  Shield, 
  Bell,
  MapPin,
  Clock,
  Download,
  Settings,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Info,
  Map
} from 'lucide-react';
// Map functionality temporarily removed for demo

import { User } from '@supabase/supabase-js';

interface UserDashboardProps {
  user: User;
  onSignOut: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [alertPreferences, setAlertPreferences] = useState({
    earthquakes: true,
    floods: true,
    fires: true,
    storms: true,
    misinformation: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    radius: 50 // km
  });

  const [showPopup, setShowPopup] = useState<string | null>(null);

  // Mock data for alerts and misinformation
  const activeAlerts = [
    {
      id: 1,
      type: 'flood',
      title: 'Flash Flood Warning',
      description: 'Heavy rainfall causing flash flooding in downtown area. Avoid low-lying roads.',
      location: 'Downtown District',
      severity: 'high',
      distance: 2.3,
      timestamp: '15 minutes ago',
      coordinates: [40.7589, -73.9851],
      status: 'active'
    },
    {
      id: 2,
      type: 'storm',
      title: 'Severe Thunderstorm Watch',
      description: 'Severe thunderstorms with damaging winds and hail possible.',
      location: 'Metropolitan Area',
      severity: 'medium',
      distance: 12.8,
      timestamp: '1 hour ago',
      coordinates: [40.7505, -73.9934],
      status: 'monitoring'
    },
    {
      id: 3,
      type: 'earthquake',
      title: 'Earthquake Advisory',
      description: 'Minor earthquake detected. No immediate danger but aftershocks possible.',
      location: 'Regional Zone',
      severity: 'low',
      distance: 45.2,
      timestamp: '3 hours ago',
      coordinates: [40.6892, -74.0445],
      status: 'resolved'
    }
  ];

  const misinformationReports = [
    {
      id: 1,
      title: 'False Evacuation Order',
      description: 'Fake emergency evacuation order circulating on social media.',
      source: 'Social Media',
      confidence: 95,
      timestamp: '30 minutes ago',
      status: 'verified_false',
      action: 'Report shared with authorities'
    },
    {
      id: 2,
      title: 'Exaggerated Damage Claims',
      description: 'Images from previous disasters being shared as current event.',
      source: 'News Platform',
      confidence: 87,
      timestamp: '2 hours ago',
      status: 'flagged',
      action: 'Under review'
    },
    {
      id: 3,
      title: 'Unverified Casualty Reports',
      description: 'Unconfirmed casualty numbers spreading without official source.',
      source: 'Messaging App',
      confidence: 72,
      timestamp: '4 hours ago',
      status: 'investigating',
      action: 'Fact-checking in progress'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-500 border-red-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'low': return 'text-green-500 border-green-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified_false': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'investigating': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'flood': return '🌊';
      case 'earthquake': return '🌍';
      case 'fire': return '🔥';
      case 'storm': return '⛈️';
      default: return '⚠️';
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
              <h1 className="text-2xl font-bold text-white">Aegis Vision</h1>
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
            <TabsTrigger value="alerts" className="text-white">Active Alerts</TabsTrigger>
            <TabsTrigger value="misinformation" className="text-white">Misinformation</TabsTrigger>
            <TabsTrigger value="map" className="text-white">Map View</TabsTrigger>
            <TabsTrigger value="settings" className="text-white">Settings</TabsTrigger>
          </TabsList>

          {/* Active Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Active Alerts in Your Area
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Disaster alerts within {alertPreferences.radius}km of your location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 border-l-4 bg-white/5 rounded-lg ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                            <div>
                              <h3 className="text-white font-semibold">{alert.title}</h3>
                              <p className="text-gray-300 text-sm mt-1">{alert.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {alert.location} ({alert.distance}km away)
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {alert.timestamp}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Misinformation Tab */}
          <TabsContent value="misinformation" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Misinformation Detection
                </CardTitle>
                <CardDescription className="text-gray-300">
                  AI-powered detection of false information and rumors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {misinformationReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(report.status)}
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">{report.title}</h3>
                            <p className="text-gray-300 text-sm mt-1">{report.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <span>Source: {report.source}</span>
                                <span>{report.timestamp}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">Confidence:</span>
                                <Badge variant="outline" className="text-white">
                                  {report.confidence}%
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs text-blue-400">Action: {report.action}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Interactive Map
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Real-time visualization of alerts and incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                      {activeAlerts.map((alert) => (
                        <div key={alert.id} className="p-4 bg-white/10 rounded-lg border border-white/20">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getAlertIcon(alert.type)}</span>
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                          </div>
                          <p className="text-xs text-gray-300 mb-2">{alert.location}</p>
                          <div className="flex justify-between text-xs">
                            <span className={`px-2 py-1 rounded ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                              {alert.severity}
                            </span>
                            <span className="text-gray-400">{alert.distance}km</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 mt-4 text-sm">
                      📍 Interactive map view coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alert Preferences
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Customize which alerts you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="earthquakes" className="text-white">Earthquakes</Label>
                      <Switch
                        id="earthquakes"
                        checked={alertPreferences.earthquakes}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, earthquakes: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="floods" className="text-white">Floods</Label>
                      <Switch
                        id="floods"
                        checked={alertPreferences.floods}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, floods: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fires" className="text-white">Fires</Label>
                      <Switch
                        id="fires"
                        checked={alertPreferences.fires}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, fires: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="storms" className="text-white">Storms</Label>
                      <Switch
                        id="storms"
                        checked={alertPreferences.storms}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, storms: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="misinformation" className="text-white">Misinformation Alerts</Label>
                      <Switch
                        id="misinformation"
                        checked={alertPreferences.misinformation}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, misinformation: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <Label htmlFor="radius" className="text-white">Alert Radius (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={alertPreferences.radius}
                      onChange={(e) => 
                        setAlertPreferences(prev => ({ ...prev, radius: parseInt(e.target.value) || 50 }))
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications" className="text-white flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </Label>
                      <Switch
                        id="email-notifications"
                        checked={alertPreferences.emailNotifications}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications" className="text-white flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        SMS Notifications
                      </Label>
                      <Switch
                        id="sms-notifications"
                        checked={alertPreferences.smsNotifications}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, smsNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications" className="text-white flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </Label>
                      <Switch
                        id="push-notifications"
                        checked={alertPreferences.pushNotifications}
                        onCheckedChange={(checked) => 
                          setAlertPreferences(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Download className="mr-2 h-4 w-4" />
                      Export My Data
                    </Button>
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

export default UserDashboard;