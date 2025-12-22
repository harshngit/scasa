import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Search, Plus, Edit, Trash2, Eye, Loader2, TrendingUp, Building2, Home, Phone, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
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

// Simple count-up animation when value changes
function CountUpNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    prevValue.current = end;
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

export default function SocietyOwnedRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<SocietyOwnedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('society_owned_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('society_owned_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast.success('Room deleted successfully');
      fetchRooms();
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.shop_owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.shop_office_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalRooms = filteredRooms.length;
  const availableRooms = filteredRooms.filter(r => r.status === 'available').length;
  const occupiedRooms = filteredRooms.filter(r => r.status === 'occupied').length;
  const maintenanceRooms = filteredRooms.filter(r => r.status === 'maintenance').length;
  const totalRevenue = filteredRooms
    .filter(r => r.status === 'occupied' && r.rent_amount)
    .reduce((sum, r) => sum + (r.rent_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1 animate-fade-in">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-gradient">
                Society Owned Rooms
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage society owned rooms and their occupancy
              </p>
            </div>
            <div className="ml-6 flex gap-3 animate-slide-in-right">
              <Button
                onClick={() => navigate('/society-owned-rooms/create')}
                className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 transition-all duration-300 hover:scale-105 active:scale-95 px-6 py-6 h-auto"
              >
                <Plus className="mr-2 h-5 w-5" />
                <span className="font-semibold">Add Room</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[
            {
              title: 'Total Rooms',
              value: totalRooms,
              subtitle: 'All rooms',
              icon: Building2,
              gradient: 'from-[#8c52ff] to-purple-600',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              iconBg: 'bg-[#8c52ff]/10',
              iconColor: 'text-[#8c52ff]',
              format: 'number',
            },
            {
              title: 'Available',
              value: availableRooms,
              subtitle: 'Ready to rent',
              icon: Home,
              gradient: 'from-green-500 to-emerald-600',
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
              iconBg: 'bg-green-500/10',
              iconColor: 'text-green-600 dark:text-green-400',
              format: 'number',
            },
            {
              title: 'Occupied',
              value: occupiedRooms,
              subtitle: 'Currently rented',
              icon: User,
              gradient: 'from-blue-500 to-cyan-600',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              iconBg: 'bg-blue-500/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
              format: 'number',
            },
            {
              title: 'Maintenance',
              value: maintenanceRooms,
              subtitle: 'Under repair',
              icon: Building2,
              gradient: 'from-yellow-500 to-orange-600',
              bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
              iconBg: 'bg-yellow-500/10',
              iconColor: 'text-yellow-600 dark:text-yellow-400',
              format: 'number',
            },
            {
              title: 'Monthly Revenue',
              value: totalRevenue,
              subtitle: 'From occupied rooms',
              icon: TrendingUp,
              gradient: 'from-emerald-500 to-teal-600',
              bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
              iconBg: 'bg-emerald-500/10',
              iconColor: 'text-emerald-600 dark:text-emerald-400',
              format: 'currency',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
              >
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  card.bgGradient
                )} />
                <div className={cn(
                  'absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b transition-all duration-500 group-hover:w-2',
                  card.gradient
                )} />
                <div className={cn(
                  'absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500',
                  card.gradient
                )} />
                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {card.title}
                  </CardTitle>
                  <div className={cn(
                    'p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6',
                    card.iconBg
                  )}>
                    <Icon className={cn('h-5 w-5', card.iconColor)} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <div className={cn(
                      'text-3xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
                      card.gradient
                    )}>
                      {card.format === 'currency' ? (
                        <>₹<CountUpNumber value={card.value} /></>
                      ) : (
                        <CountUpNumber value={card.value} />
                      )}
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-[#8c52ff] transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by room number, tenant name, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="h-12 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                </div>
                <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading rooms...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Building2 className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No rooms found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                    {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter.' : 'Get started by adding a new room.'}
                  </p>
                  {!searchTerm && filterStatus === 'all' && (
                    <Button
                      onClick={() => navigate('/society-owned-rooms/create')}
                      className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Room
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Room Number</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Type</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Shop Owner</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Shop/Office Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Finance (₹)</TableHead>
                      <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room, idx) => (
                      <TableRow
                        key={room.id}
                        className={cn(
                          "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                          "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                          idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                        )}
                      >
                        <TableCell className="py-4">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{room.room_number}</span>
                        </TableCell>
                        <TableCell className="py-4 text-gray-700 dark:text-gray-300">
                          {room.room_type === 'commercial-office' ? 'Commercial Office' : 'Shop'}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            room.status === 'available'
                              ? "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-800"
                              : room.status === 'occupied'
                                ? "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-800"
                                : "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800"
                          )}>
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          {room.shop_owner_name ? (
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{room.shop_owner_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-gray-700 dark:text-gray-300">
                          {room.shop_office_name || '-'}
                        </TableCell>
                        <TableCell className="py-4">
                          {room.finance_money ? (
                            <span className="font-semibold text-gray-900 dark:text-gray-100">₹{room.finance_money.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/society-owned-rooms/${room.id}`)}
                              title="View Room"
                              className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/society-owned-rooms/${room.id}/edit`)}
                              title="Edit Room"
                              className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRoomToDelete(room.id);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={isDeleting}
                              title="Delete Room"
                              className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the room
                {roomToDelete && rooms.find(r => r.id === roomToDelete) && (
                  <> <strong>{rooms.find(r => r.id === roomToDelete)?.room_number}</strong></>
                )}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setRoomToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => roomToDelete && handleDelete(roomToDelete)}
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

