import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, CreditCard } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockAmenityBookings } from '@/lib/mockData';
import type { AmenityBooking } from '@/types';

export default function Amenities() {
  const [bookings] = useState<AmenityBooking[]>(mockAmenityBookings);

  const amenities = [
    { name: 'Community Hall', capacity: '100 people', rate: '₹2,000/4hrs', available: true },
    { name: 'Swimming Pool', capacity: '20 people', rate: '₹500/2hrs', available: true },
    { name: 'Gymnasium', capacity: '15 people', rate: '₹300/hr', available: false },
    { name: 'Tennis Court', capacity: '4 people', rate: '₹800/hr', available: true },
    { name: 'Badminton Court', capacity: '4 people', rate: '₹400/hr', available: true },
    { name: 'Children\'s Play Area', capacity: '30 people', rate: 'Free', available: true },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Amenities</h1>
            <p className="text-muted-foreground">
              Book and manage society amenities and facilities
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Book Amenity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book Amenity</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amenity">Amenity</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select amenity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community-hall">Community Hall</SelectItem>
                      <SelectItem value="swimming-pool">Swimming Pool</SelectItem>
                      <SelectItem value="gymnasium">Gymnasium</SelectItem>
                      <SelectItem value="tennis-court">Tennis Court</SelectItem>
                      <SelectItem value="badminton-court">Badminton Court</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time Slot</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">6:00 AM - 10:00 AM</SelectItem>
                      <SelectItem value="afternoon">10:00 AM - 2:00 PM</SelectItem>
                      <SelectItem value="evening">2:00 PM - 6:00 PM</SelectItem>
                      <SelectItem value="night">6:00 PM - 10:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="flat">Flat Number</Label>
                  <Input id="flat" placeholder="e.g., A-101" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Book Amenity</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Amenities</h2>
            <div className="space-y-3">
              {amenities.map((amenity, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{amenity.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{amenity.capacity}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CreditCard className="h-3 w-3" />
                            <span>{amenity.rate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={amenity.available ? 'default' : 'secondary'}>
                          {amenity.available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Button size="sm" disabled={!amenity.available}>
                          Book
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{booking.amenityName}</CardTitle>
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Booked by:</span>
                        <span className="font-medium">{booking.bookedBy}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Flat:</span>
                        <span className="font-medium">{booking.flatNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{booking.timeSlot}</span>
                      </div>
                    </div>
                    {booking.amount && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Amount:</span>
                        <span className="font-semibold">₹{booking.amount}</span>
                      </div>
                    )}
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Modify
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}