import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Camera, 
  AlertTriangle, 
  Shield, 
  Eye, 
  MessageSquare, 
  Send, 
  Users, 
  Activity,
  Zap,
  Brain,
  Video,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw
} from 'lucide-react';

interface SecurityAlert {
  id: string;
  type: 'intrusion' | 'suspicious' | 'emergency' | 'maintenance' | 'visitor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  aiConfidence: number;
  cameraId?: string;
}

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  isRecording: boolean;
  lastActivity: string;
  aiEnabled: boolean;
  videoType: 'canvas' | 'iframe' | 'placeholder';
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: 'text' | 'alert' | 'system';
  avatar?: string;
}

// Advanced Video Feed Component with Canvas-based Animation
const AdvancedVideoFeed = ({ camera, isSelected, isPlaying }: { camera: CameraFeed, isSelected: boolean, isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [currentFrame, setCurrentFrame] = useState(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || camera.status !== 'online') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!isPlaying) return;

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Generate different patterns based on camera type
      const time = Date.now() * 0.001;
      
      if (camera.id === 'cam-01') {
        // Main Gate - Simulate entrance with moving elements
        drawMainGateScene(ctx, canvas, time);
      } else if (camera.id === 'cam-02') {
        // Lobby - Indoor scene with people
        drawLobbyScene(ctx, canvas, time);
      } else if (camera.id === 'cam-03') {
        // Block A - Building entrance
        drawBlockAScene(ctx, canvas, time);
      } else if (camera.id === 'cam-05') {
        // Parking - Vehicles and movement
        drawParkingScene(ctx, canvas, time);
      }

      // Add security camera effects
      drawSecurityEffects(ctx, canvas, time);

      setCurrentFrame(prev => prev + 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera.id, camera.status, isPlaying]);

  const drawMainGateScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2d3748');
    gradient.addColorStop(1, '#1a202c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gate structure
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.4, canvas.width * 0.6, canvas.height * 0.4);
    
    // Moving person
    const personX = (canvas.width * 0.3) + Math.sin(time * 0.5) * 50;
    const personY = canvas.height * 0.7;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(personX, personY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Vehicle approaching
    const carX = (canvas.width * 0.1) + (time * 20) % canvas.width;
    const carY = canvas.height * 0.8;
    ctx.fillStyle = '#3182ce';
    ctx.fillRect(carX, carY, 40, 20);
  };

  const drawLobbyScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Indoor lighting
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, '#4a5568');
    gradient.addColorStop(1, '#2d3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Furniture
    ctx.fillStyle = '#718096';
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.6, canvas.width * 0.2, canvas.height * 0.2);
    ctx.fillRect(canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.2, canvas.height * 0.2);

    // Walking people
    const person1X = (canvas.width * 0.4) + Math.cos(time * 0.3) * 30;
    const person1Y = canvas.height * 0.75;
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.arc(person1X, person1Y, 6, 0, Math.PI * 2);
    ctx.fill();

    const person2X = (canvas.width * 0.6) + Math.sin(time * 0.4) * 20;
    const person2Y = canvas.height * 0.7;
    ctx.fillStyle = '#38a169';
    ctx.beginPath();
    ctx.arc(person2X, person2Y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawBlockAScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Building exterior
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

    // Building windows
    ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        if (Math.sin(time + i + j) > 0) {
          ctx.fillRect(canvas.width * 0.1 + i * canvas.width * 0.15, canvas.height * 0.1 + j * canvas.height * 0.15, 20, 15);
        }
      }
    }

    // Person at entrance
    const personX = canvas.width * 0.5 + Math.sin(time * 0.6) * 15;
    const personY = canvas.height * 0.8;
    ctx.fillStyle = '#9f7aea';
    ctx.beginPath();
    ctx.arc(personX, personY, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawParkingScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Parking lot ground
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parking lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * canvas.width * 0.25, canvas.height * 0.5);
      ctx.lineTo(i * canvas.width * 0.25, canvas.height);
      ctx.stroke();
    }

    // Parked cars
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(canvas.width * 0.05, canvas.height * 0.6, 35, 20);
    ctx.fillStyle = '#3182ce';
    ctx.fillRect(canvas.width * 0.55, canvas.height * 0.6, 35, 20);

    // Moving car
    const movingCarX = (canvas.width * 0.3) + Math.sin(time * 0.4) * 40;
    const movingCarY = canvas.height * 0.8;
    ctx.fillStyle = '#38a169';
    ctx.fillRect(movingCarX, movingCarY, 40, 22);

    // Person walking
    const personX = (canvas.width * 0.7) + Math.cos(time * 0.5) * 25;
    const personY = canvas.height * 0.85;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(personX, personY, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSecurityEffects = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Scan line
    const scanY = (time * 50) % canvas.height;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(canvas.width, scanY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Corner brackets
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    const bracketSize = 20;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(10, 10 + bracketSize);
    ctx.lineTo(10, 10);
    ctx.lineTo(10 + bracketSize, 10);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - 10 - bracketSize, 10);
    ctx.lineTo(canvas.width - 10, 10);
    ctx.lineTo(canvas.width - 10, 10 + bracketSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(10, canvas.height - 10 - bracketSize);
    ctx.lineTo(10, canvas.height - 10);
    ctx.lineTo(10 + bracketSize, canvas.height - 10);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - 10 - bracketSize, canvas.height - 10);
    ctx.lineTo(canvas.width - 10, canvas.height - 10);
    ctx.lineTo(canvas.width - 10, canvas.height - 10 - bracketSize);
    ctx.stroke();

    // Motion detection indicator
    if (Math.sin(time * 2) > 0.5) {
      ctx.fillStyle = '#ff0000';
      ctx.font = '12px monospace';
      ctx.fillText('MOTION', canvas.width - 80, 25);
    }

    // Timestamp
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width - 120, canvas.height - 25, 110, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(new Date().toLocaleTimeString(), canvas.width - 115, canvas.height - 10);
  };

  if (camera.status !== 'online') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <XCircle className="h-12 w-12 mx-auto mb-3" />
          <div className="text-lg font-medium">
            {camera.status === 'offline' ? 'Camera Offline' : 'Under Maintenance'}
          </div>
          <div className="text-sm opacity-75">No signal detected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Camera info overlay */}
      <div className="absolute bottom-4 left-4 text-white text-xs z-10">
        <div className="font-medium bg-black bg-opacity-70 px-2 py-1 rounded mb-1">
          📹 {camera.name}
        </div>
        <div className="opacity-90 bg-black bg-opacity-50 px-2 py-1 rounded">
          📍 {camera.location}
        </div>
      </div>

      {/* AI Analysis overlay */}
      {camera.aiEnabled && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-blue-600 text-white">
            <Brain className="h-3 w-3 mr-1" />
            AI ACTIVE
          </Badge>
        </div>
      )}

      {/* Motion detection indicator */}
      {camera.aiEnabled && Math.sin(currentFrame * 0.1) > 0.5 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse">
            MOTION DETECTED
          </div>
        </div>
      )}
    </div>
  );
};

export default function SecurityAdvanced() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'intrusion',
      severity: 'high',
      message: 'Unauthorized person detected near main entrance',
      location: 'Main Gate - Camera 01',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'active',
      aiConfidence: 95,
      cameraId: 'cam-01'
    },
    {
      id: '2',
      type: 'suspicious',
      severity: 'medium',
      message: 'Person loitering in parking area for extended period',
      location: 'Parking Area - Camera 05',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      status: 'investigating',
      aiConfidence: 78,
      cameraId: 'cam-05'
    },
    {
      id: '3',
      type: 'visitor',
      severity: 'low',
      message: 'Unregistered visitor detected at Block A entrance',
      location: 'Block A - Camera 03',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'resolved',
      aiConfidence: 89,
      cameraId: 'cam-03'
    }
  ]);

  const [cameras] = useState<CameraFeed[]>([
    {
      id: 'cam-01',
      name: 'Main Gate',
      location: 'Entrance',
      status: 'online',
      isRecording: true,
      lastActivity: '2 min ago',
      aiEnabled: true,
      videoType: 'canvas'
    },
    {
      id: 'cam-02',
      name: 'Lobby',
      location: 'Ground Floor',
      status: 'online',
      isRecording: true,
      lastActivity: '1 min ago',
      aiEnabled: true,
      videoType: 'canvas'
    },
    {
      id: 'cam-03',
      name: 'Block A Entrance',
      location: 'Block A',
      status: 'online',
      isRecording: false,
      lastActivity: '5 min ago',
      aiEnabled: true,
      videoType: 'canvas'
    },
    {
      id: 'cam-04',
      name: 'Swimming Pool',
      location: 'Amenities',
      status: 'offline',
      isRecording: false,
      lastActivity: '2 hours ago',
      aiEnabled: false,
      videoType: 'placeholder'
    },
    {
      id: 'cam-05',
      name: 'Parking Area',
      location: 'Basement',
      status: 'online',
      isRecording: true,
      lastActivity: 'Live',
      aiEnabled: true,
      videoType: 'canvas'
    },
    {
      id: 'cam-06',
      name: 'Garden Area',
      location: 'Outdoor',
      status: 'maintenance',
      isRecording: false,
      lastActivity: '1 day ago',
      aiEnabled: false,
      videoType: 'placeholder'
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Security Guard',
      message: 'All clear on night patrol. No suspicious activity detected.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'text',
      avatar: 'SG'
    },
    {
      id: '2',
      sender: 'AI System',
      message: 'Motion detected at main entrance. Visitor registered successfully.',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      type: 'system'
    },
    {
      id: '3',
      sender: 'Admin',
      message: 'Please check the parking area camera. Resident reported suspicious activity.',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: 'text',
      avatar: 'AD'
    },
    {
      id: '4',
      sender: 'AI Alert',
      message: '🚨 High confidence intrusion alert at main gate',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'alert'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<string>('cam-01');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const alertTypes: SecurityAlert['type'][] = ['suspicious', 'visitor', 'maintenance'];
      const alertSeverities: SecurityAlert['severity'][] = ['low', 'medium'];
      const locations = ['Main Gate', 'Parking Area', 'Block A', 'Garden Area'];
      const messages = [
        'Motion detected in restricted area',
        'Unidentified person near entrance',
        'Vehicle parked in no-parking zone',
        'Maintenance required for camera system'
      ];

      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const newAlert: SecurityAlert = {
          id: Date.now().toString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: alertSeverities[Math.floor(Math.random() * alertSeverities.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          timestamp: new Date().toISOString(),
          status: 'active',
          aiConfidence: Math.floor(Math.random() * 30) + 70,
          cameraId: `cam-0${Math.floor(Math.random() * 6) + 1}`
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toISOString(),
        type: 'text',
        avatar: 'YU'
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      )
    );
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active').length;
  const onlineCameras = cameras.filter(cam => cam.status === 'online').length;
  const aiEnabledCameras = cameras.filter(cam => cam.aiEnabled).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Security Center</h1>
            <p className="text-muted-foreground">
              AI-powered security monitoring and surveillance system with live video feeds
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Bell className="mr-2 h-4 w-4" />
              Alert Settings
            </Button>
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Security Report
            </Button>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{activeAlerts}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cameras Online</CardTitle>
              <Camera className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineCameras}/6</div>
              <p className="text-xs text-muted-foreground">Live monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
              <Brain className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{aiEnabledCameras}</div>
              <p className="text-xs text-muted-foreground">AI-enabled cameras</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">98%</div>
              <p className="text-xs text-muted-foreground">System uptime</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cameras" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cameras">📹 Live Camera Feeds</TabsTrigger>
            <TabsTrigger value="alerts">🚨 Security Alerts</TabsTrigger>
            <TabsTrigger value="ai">🤖 AI Analysis</TabsTrigger>
            <TabsTrigger value="chat">💬 Security Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="cameras" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Camera Grid */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>🎥 Live Security Camera Feeds</span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setIsPlaying(!isPlaying)}>
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {isPlaying ? ' Pause' : ' Play'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {cameras.slice(0, 4).map((camera) => (
                        <div 
                          key={camera.id}
                          className={`relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedCamera === camera.id ? 'border-blue-500 shadow-lg' : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => setSelectedCamera(camera.id)}
                        >
                          {/* Advanced Video Feed */}
                          <AdvancedVideoFeed 
                            camera={camera} 
                            isSelected={selectedCamera === camera.id}
                            isPlaying={isPlaying}
                          />
                          
                          {/* Camera Status Overlay */}
                          <div className="absolute top-2 left-2 flex space-x-2 z-20">
                            <Badge variant={camera.status === 'online' ? 'default' : 'secondary'}>
                              <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(camera.status)} bg-current`} />
                              {camera.status.toUpperCase()}
                            </Badge>
                            {camera.isRecording && (
                              <Badge variant="destructive">
                                <div className="w-2 h-2 rounded-full mr-1 bg-red-500 animate-pulse" />
                                REC
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      💡 Click on any camera feed to select it. Use play/pause controls to manage all feeds.
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Camera List */}
              <Card>
                <CardHeader>
                  <CardTitle>📋 All Security Cameras</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {cameras.map((camera) => (
                        <div 
                          key={camera.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCamera === camera.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedCamera(camera.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{camera.name}</div>
                              <div className="text-sm text-muted-foreground">📍 {camera.location}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                ⏰ Last: {camera.lastActivity}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge variant={camera.status === 'online' ? 'default' : 'secondary'}>
                                {camera.status}
                              </Badge>
                              {camera.aiEnabled && (
                                <Badge variant="outline" className="text-xs">
                                  🤖 AI
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🚨 Security Alerts & AI Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {alert.type.replace('-', ' ').toUpperCase()}
                              </Badge>
                              <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                                {alert.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <div className="font-medium">{alert.message}</div>
                              <div className="text-sm text-muted-foreground flex items-center space-x-4 mt-1">
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {alert.location}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(alert.timestamp).toLocaleString()}
                                </span>
                                <span className="flex items-center">
                                  <Brain className="h-3 w-3 mr-1" />
                                  AI: {alert.aiConfidence}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {alert.status === 'active' && (
                              <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Analysis Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">👤 Facial Recognition</div>
                          <div className="text-sm text-muted-foreground">Active on 4 cameras</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          <Brain className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">🏃 Motion Detection</div>
                          <div className="text-sm text-muted-foreground">Advanced AI algorithms</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">🔍 Behavior Analysis</div>
                          <div className="text-sm text-muted-foreground">Suspicious activity detection</div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Learning
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">📦 Object Detection</div>
                          <div className="text-sm text-muted-foreground">Vehicles, packages, weapons</div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Recent AI Detections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {[
                        { type: '👤 Person', confidence: 98, location: 'Main Gate', time: '2 min ago' },
                        { type: '🚗 Vehicle', confidence: 95, location: 'Parking', time: '5 min ago' },
                        { type: '📦 Package', confidence: 87, location: 'Lobby', time: '12 min ago' },
                        { type: '❓ Unknown Person', confidence: 76, location: 'Block A', time: '18 min ago' },
                        { type: '🐕 Pet', confidence: 92, location: 'Garden', time: '25 min ago' },
                      ].map((detection, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{detection.type}</div>
                            <div className="text-sm text-muted-foreground">📍 {detection.location}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{detection.confidence}%</div>
                            <div className="text-xs text-muted-foreground">{detection.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    💬 Security Communication Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={
                              message.type === 'system' ? 'bg-blue-100 text-blue-600' :
                              message.type === 'alert' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }>
                              {message.avatar || (message.type === 'system' ? '🤖' : message.type === 'alert' ? '⚠️' : message.sender[0])}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{message.sender}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={`text-sm p-3 rounded-lg ${
                              message.type === 'alert' ? 'bg-red-50 text-red-800 border border-red-200' :
                              message.type === 'system' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-gray-50'
                            }`}>
                              {message.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    👥 Online Staff
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: '👮 Security Guard', status: 'online', location: 'Main Gate' },
                      { name: '🌙 Night Watchman', status: 'online', location: 'Patrol' },
                      { name: '👨‍💼 Admin', status: 'online', location: 'Office' },
                      { name: '🔧 Maintenance', status: 'away', location: 'Block B' },
                      { name: '🤖 AI System', status: 'online', location: 'Server Room' },
                    ].map((staff, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {staff.name.split(' ').map(n => n[0]).join('').replace(/[^\w]/g, '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{staff.name}</div>
                          <div className="text-xs text-muted-foreground">📍 {staff.location}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          staff.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}