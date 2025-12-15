import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Clock, CheckCircle, XCircle, User, Phone, MapPin, Camera, Upload, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ImageCapture } from '@/components/ui/image-capture';
import { mockVisitors } from '@/lib/mockData';
import { getCurrentUser, canWrite, canDelete, isAdmin } from '@/lib/auth';
import type { Visitor } from '@/types';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageCaptureOpen, setIsImageCaptureOpen] = useState(false);
  const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phoneNumber: '',
    visitingFlat: '',
    purpose: '',
    parkingSlot: ''
  });
  const currentUser = getCurrentUser();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in': return 'default';
      case 'checked-out': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked-in': return CheckCircle;
      case 'checked-out': return XCircle;
      default: return Clock;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewVisitor(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCapture = (imageData: string) => {
    setVisitorPhoto(imageData);
    setIsImageCaptureOpen(false);
  };

  const removePhoto = () => {
    setVisitorPhoto(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVisitor.name || !newVisitor.phoneNumber || !newVisitor.visitingFlat) {
      alert('Please fill in all required fields');
      return;
    }

    const visitor: Visitor = {
      id: (visitors.length + 1).toString(),
      name: newVisitor.name,
      phoneNumber: newVisitor.phoneNumber,
      visitingFlat: newVisitor.visitingFlat,
      purpose: newVisitor.purpose || 'Personal Visit',
      entryTime: new Date().toISOString(),
      status: 'checked-in',
      approvedBy: currentUser.name,
      parkingSlot: newVisitor.parkingSlot || undefined,
      photo: visitorPhoto || undefined
    };

    setVisitors(prev => [visitor, ...prev]);
    setNewVisitor({
      name: '',
      phoneNumber: '',
      visitingFlat: '',
      purpose: '',
      parkingSlot: ''
    });
    setVisitorPhoto(null);
    setIsDialogOpen(false);
  };

  const handleCheckOut = (visitorId: string) => {
    setVisitors(prev => 
      prev.map(visitor => 
        visitor.id === visitorId 
          ? { ...visitor, status: 'checked-out' as const, exitTime: new Date().toISOString() }
          : visitor
      )
    );
  };

  const checkedInVisitors = visitors.filter(v => v.status === 'checked-in').length;
  const totalVisitorsToday = visitors.filter(v => 
    new Date(v.entryTime).toDateString() === new Date().toDateString()
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visitor Management</h1>
            <p className="text-muted-foreground">
              Track and manage visitor entries and exits
            </p>
          </div>
          {canWrite('visitors') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Visitor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Register New Visitor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Photo Section */}
                  <div className="space-y-3">
                    <Label>Visitor Photo</Label>
                    {visitorPhoto ? (
                      <div className="relative inline-block">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={visitorPhoto} alt="Visitor" />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removePhoto}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsImageCaptureOpen(true)}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Take Photo
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="visitor-name">Visitor Name *</Label>
                      <Input
                        id="visitor-name"
                        placeholder="Enter visitor's full name"
                        value={newVisitor.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="visitor-phone">Phone Number *</Label>
                      <Input
                        id="visitor-phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={newVisitor.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="visiting-flat">Visiting Flat *</Label>
                      <Input
                        id="visiting-flat"
                        placeholder="e.g., A-101"
                        value={newVisitor.visitingFlat}
                        onChange={(e) => handleInputChange('visitingFlat', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="purpose">Purpose of Visit</Label>
                      <Textarea
                        id="purpose"
                        placeholder="Enter purpose of visit"
                        value={newVisitor.purpose}
                        onChange={(e) => handleInputChange('purpose', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="parking-slot">Parking Slot (Optional)</Label>
                      <Input
                        id="parking-slot"
                        placeholder="e.g., V-01"
                        value={newVisitor.parkingSlot}
                        onChange={(e) => handleInputChange('parkingSlot', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Register Visitor</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Inside</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{checkedInVisitors}</div>
              <p className="text-xs text-muted-foreground">Active visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitorsToday}</div>
              <p className="text-xs text-muted-foreground">Total entries today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitors.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {visitors.map((visitor) => {
            const StatusIcon = getStatusIcon(visitor.status);
            return (
              <Card key={visitor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={visitor.photo} alt={visitor.name} />
                        <AvatarFallback>
                          {visitor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{visitor.name}</h3>
                          <Badge variant={getStatusColor(visitor.status)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {visitor.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{visitor.phoneNumber}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>Visiting {visitor.visitingFlat}</span>
                          </div>
                          {visitor.parkingSlot && (
                            <div className="flex items-center space-x-1">
                              <span>Parking: {visitor.parkingSlot}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <div>Entry: {new Date(visitor.entryTime).toLocaleString()}</div>
                        {visitor.exitTime && (
                          <div>Exit: {new Date(visitor.exitTime).toLocaleString()}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Approved by: {visitor.approvedBy}
                      </div>
                      {visitor.status === 'checked-in' && canWrite('visitors') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(visitor.id)}
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {visitor.purpose && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Purpose:</strong> {visitor.purpose}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ImageCapture
          isOpen={isImageCaptureOpen}
          onImageCapture={handleImageCapture}
          onCancel={() => setIsImageCaptureOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}