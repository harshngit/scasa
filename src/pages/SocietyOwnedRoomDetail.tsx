import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Phone, Calendar, DollarSign, Loader2, Trash2, User, Building2, Home, Mail, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SocietyOwnedRoom {
  id: string;
  room_number: string;
  room_type: string;
  status: 'available' | 'occupied' | 'maintenance';
  shop_owner_name: string | null;
  shop_owner_phone: string | null;
  shop_owner_email: string | null;
  shop_office_name: string | null;
  office_telephone: string | null;
  workers_employees: number | null;
  manager_name: string | null;
  manager_phone: string | null;
  finance_month: number | null;
  finance_money: number | null;
  created_at: string;
  updated_at: string;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SocietyOwnedRoomDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [room, setRoom] = useState<SocietyOwnedRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRoom(id);
    }
  }, [id]);

  const fetchRoom = async (roomId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('society_owned_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room:', error);
        toast.error('Failed to load room details');
        navigate('/society-owned-rooms');
        return;
      }

      setRoom(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load room details');
      navigate('/society-owned-rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!room) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('society_owned_rooms')
        .delete()
        .eq('id', room.id);

      if (error) throw error;

      toast.success('Room deleted successfully');
      navigate('/society-owned-rooms');
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading room details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Room Not Found</h3>
            <p className="text-muted-foreground">The requested room could not be found.</p>
            <Button onClick={() => navigate('/society-owned-rooms')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/society-owned-rooms')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Room Details
                </h1>
                <p className="text-muted-foreground">
                  View complete information about the room
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/society-owned-rooms/${id}/edit`)}
                className="border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                className="border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Home className="h-5 w-5 text-[#8c52ff]" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#8c52ff]" />
                  Room Number
                </Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.room_number}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Room Type
                </Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {room.room_type === 'commercial-office' ? 'Commercial Office' : 'Shop'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </Label>
                <Badge
                  className={cn(
                    "px-3 py-1 text-sm font-medium",
                    room.status === 'available'
                      ? "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-800"
                      : room.status === 'occupied'
                        ? "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-800"
                        : "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800"
                  )}
                >
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </Badge>
              </div>
              {room.shop_owner_name && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#8c52ff]" />
                    Shop Owner Name
                  </Label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.shop_owner_name}</p>
                </div>
              )}
              {room.shop_owner_phone && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Phone Number
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.shop_owner_phone}</p>
                  </div>
                </div>
              )}
              {room.shop_owner_email && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#8c52ff]" />
                    Email Address
                  </Label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.shop_owner_email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shop Details */}
        {(room.shop_office_name || room.office_telephone || room.workers_employees) && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-[#8c52ff]" />
                Shop Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {room.shop_office_name && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Shop / Office Name
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.shop_office_name}</p>
                  </div>
                )}
                {room.office_telephone && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#8c52ff]" />
                      Office Telephone Number
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.office_telephone}</p>
                  </div>
                )}
                {room.workers_employees !== null && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#8c52ff]" />
                      Workers Or Employees in the Office
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.workers_employees}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manager Details */}
        {(room.manager_name || room.manager_phone) && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-[#8c52ff]" />
                Manager Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {room.manager_name && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <User className="h-4 w-4 text-[#8c52ff]" />
                      Manager Name
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.manager_name}</p>
                  </div>
                )}
                {room.manager_phone && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#8c52ff]" />
                      Manager Phone Number
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.manager_phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finance Details */}
        {(room.finance_month || room.finance_money) && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="h-5 w-5 text-[#8c52ff]" />
                Finance Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {room.finance_month && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#8c52ff]" />
                      Month
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {monthNames[room.finance_month - 1]}
                    </p>
                  </div>
                )}
                {room.finance_money && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#8c52ff]" />
                      Money
                    </Label>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{room.finance_money.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-[#8c52ff]" />
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Created At
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(room.created_at).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Last Updated
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(room.updated_at).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the room
                <strong> {room.room_number}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
