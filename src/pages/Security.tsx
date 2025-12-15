import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Shield, AlertTriangle, Camera, Users, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockEmergencyContacts, mockVisitors } from '@/lib/mockData';

export default function Security() {
  const emergencyContacts = mockEmergencyContacts;
  const activeVisitors = mockVisitors.filter(v => v.status === 'checked-in');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'fire': return 'bg-orange-100 text-orange-800';
      case 'police': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const securityAlerts = [
    { id: 1, type: 'info', message: 'All security systems operational', time: '10 minutes ago' },
    { id: 2, type: 'warning', message: 'Gate B camera offline - maintenance required', time: '2 hours ago' },
    { id: 3, type: 'info', message: 'Night shift security guard checked in', time: '8 hours ago' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground">
            Security overview and emergency contacts
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVisitors.length}</div>
              <p className="text-xs text-muted-foreground">Currently in premises</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CCTV Status</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">12/13</div>
              <p className="text-xs text-muted-foreground">Cameras online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Staff</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">2/2</div>
              <p className="text-xs text-muted-foreground">On duty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Patrol</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2:30 PM</div>
              <p className="text-xs text-muted-foreground">Block A completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Emergency Contacts</h2>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getCategoryColor(contact.category)}`}>
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">{contact.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">{contact.phoneNumber}</div>
                        <Button size="sm" className="mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Security Alerts</h2>
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <Alert key={alert.id} className={alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <span>{alert.message}</span>
                      <span className="text-xs text-muted-foreground ml-2">{alert.time}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                {activeVisitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visitors currently in premises</p>
                ) : (
                  <div className="space-y-2">
                    {activeVisitors.map((visitor) => (
                      <div key={visitor.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{visitor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Visiting {visitor.visitingFlat} • {visitor.purpose}
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start">
                    <Camera className="mr-2 h-4 w-4" />
                    View CCTV Feeds
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Patrol Log
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Staff Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}