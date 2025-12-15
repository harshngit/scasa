import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Car, Bike, Clock, CreditCard, MapPin, User, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockParkingSlots, mockParkingPayments } from '@/lib/mockData';
import { getCurrentUser, canWrite, canDelete, isAdmin, isResident } from '@/lib/auth';
import type { ParkingSlot, ParkingPayment } from '@/types';

export default function Parking() {
  const [parkingSlots] = useState<ParkingSlot[]>(mockParkingSlots);
  const [payments] = useState<ParkingPayment[]>(mockParkingPayments);
  const currentUser = getCurrentUser();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'destructive';
      case 'available': return 'default';
      case 'reserved': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'car':
      case 'suv': return Car;
      case 'bike': return Bike;
      default: return Car;
    }
  };

  const residentSlots = parkingSlots.filter(slot => slot.type === 'resident');
  const visitorSlots = parkingSlots.filter(slot => slot.type === 'visitor');
  const guestSlots = parkingSlots.filter(slot => slot.type === 'guest');

  const occupiedSlots = parkingSlots.filter(slot => slot.status === 'occupied').length;
  const availableSlots = parkingSlots.filter(slot => slot.status === 'available').length;
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Filter slots based on user role
  const getVisibleSlots = (slots: ParkingSlot[]) => {
    if (isAdmin() || currentUser.role === 'receptionist') {
      return slots;
    }
    if (isResident()) {
      return slots.filter(slot => 
        slot.flatNumber === currentUser.flatNumber || 
        slot.type === 'visitor' || 
        slot.type === 'guest'
      );
    }
    return slots.filter(slot => slot.type === 'visitor' || slot.type === 'guest');
  };

  const ParkingSlotCard = ({ slot }: { slot: ParkingSlot }) => {
    const TypeIcon = getTypeIcon(slot.vehicleType);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${slot.status === 'available' ? 'bg-green-100' : 'bg-red-100'}`}>
                <TypeIcon className={`h-4 w-4 ${slot.status === 'available' ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{slot.slotNumber}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{slot.type}</Badge>
                  <Badge variant={getStatusColor(slot.status)}>
                    {slot.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              {slot.monthlyRate && (
                <div className="font-semibold">₹{slot.monthlyRate}/month</div>
              )}
              {slot.hourlyRate && (
                <div className="font-semibold">₹{slot.hourlyRate}/hour</div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {slot.assignedTo && (
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">{slot.assignedTo}</span>
              </div>
            )}
            {slot.flatNumber && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Flat:</span>
                <span className="font-medium">{slot.flatNumber}</span>
              </div>
            )}
            {slot.vehicleNumber && (
              <div className="flex items-center space-x-2">
                <Car className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-medium">{slot.vehicleNumber}</span>
              </div>
            )}
            {slot.bookedFrom && slot.bookedUntil && (
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium text-xs">
                  {new Date(slot.bookedFrom).toLocaleTimeString()} - {new Date(slot.bookedUntil).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          
          {canWrite('parking') && (
            <div className="flex space-x-2 mt-4">
              {slot.status === 'available' && (
                <Button size="sm" className="flex-1">
                  {slot.type === 'visitor' ? 'Book for Visitor' : 'Assign'}
                </Button>
              )}
              {slot.status === 'occupied' && (
                <Button variant="outline" size="sm" className="flex-1">
                  Release
                </Button>
              )}
              {canDelete('parking') && (
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parking Management</h1>
            <p className="text-muted-foreground">
              Manage parking slots, assignments, and payments
            </p>
          </div>
          {canWrite('parking') && (
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Book Visitor Parking
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Book Visitor Parking</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="visitor-name">Visitor Name</Label>
                      <Input id="visitor-name" placeholder="Enter visitor name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle-number">Vehicle Number</Label>
                      <Input id="vehicle-number" placeholder="e.g., MH-01-AB-1234" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle-type">Vehicle Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duration (hours)</Label>
                      <Input id="duration" type="number" placeholder="Enter duration" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="visiting-flat">Visiting Flat</Label>
                      <Input id="visiting-flat" placeholder="e.g., A-101" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Book Parking</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {isAdmin() && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Parking Slot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Parking Slot</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="slot-number">Slot Number</Label>
                        <Input id="slot-number" placeholder="e.g., A-01" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="slot-type">Slot Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select slot type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resident">Resident</SelectItem>
                            <SelectItem value="visitor">Visitor</SelectItem>
                            <SelectItem value="guest">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vehicle-type-new">Vehicle Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="bike">Bike</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="monthly-rate">Monthly Rate (₹)</Label>
                          <Input id="monthly-rate" type="number" placeholder="1500" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="hourly-rate">Hourly Rate (₹)</Label>
                          <Input id="hourly-rate" type="number" placeholder="20" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Add Slot</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parkingSlots.length}</div>
              <p className="text-xs text-muted-foreground">Parking spaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <Car className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{occupiedSlots}</div>
              <p className="text-xs text-muted-foreground">Currently occupied</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Car className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableSlots}</div>
              <p className="text-xs text-muted-foreground">Available slots</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="resident" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resident">Resident Parking</TabsTrigger>
            <TabsTrigger value="visitor">Visitor Parking</TabsTrigger>
            {(isAdmin() || currentUser.role === 'receptionist') && (
              <TabsTrigger value="payments">Payments</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="resident" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getVisibleSlots(residentSlots).map((slot) => (
                <ParkingSlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="visitor" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getVisibleSlots([...visitorSlots, ...guestSlots]).map((slot) => (
                <ParkingSlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          </TabsContent>

          {(isAdmin() || currentUser.role === 'receptionist') && (
            <TabsContent value="payments" className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{payment.payerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.flatNumber && `${payment.flatNumber} • `}
                            {payment.paymentType} payment
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{payment.amount}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>
                        <Badge variant="default">Paid</Badge>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Receipt: {payment.receiptNumber} • Valid: {new Date(payment.validFrom).toLocaleDateString()} to {new Date(payment.validUntil).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}