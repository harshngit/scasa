import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Search, Plus, Edit, Trash2, Eye, Users, Loader2, TrendingUp, Building2, Home, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCurrentUser, isAdminOrReceptionist } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface ResidentData {
  id: string;
  owner_name: string;
  flat_number: string;
  residency_type: 'owner-living' | 'rented';
  phone_number: string;
  email: string | null;
  residents_living: any[];
  created_at: string;
  rent_end_date?: string | null;
}

// Simple count-up animation when value changes
function CountUpNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 600; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    prevValue.current = end;
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

export default function Residents() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [residents, setResidents] = useState<ResidentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<'all' | 'owner' | 'rented'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<string | null>(null);

  // Fetch residents from Supabase
  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching residents:', error);
        toast.error('Failed to load residents');
        return;
      }

      setResidents(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load residents');
    } finally {
      setIsLoading(false);
    }
  };

  // Get residency type display name
  const getResidencyTypeDisplay = (type: string) => {
    return type === 'owner-living' ? 'Owner Living' : 'Rented';
  };

  // Determine status based on rent end date (for rented) or default to active
  const getStatus = (resident: ResidentData): 'active' | 'inactive' => {
    if (resident.residency_type === 'rented' && resident.rent_end_date) {
      const endDate = new Date(resident.rent_end_date);
      const today = new Date();
      return endDate < today ? 'inactive' : 'active';
    }
    return 'active';
  };

  const filteredResidents = residents.filter(resident => {
    const matchesSearch = resident.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.phone_number.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStatus(resident);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesType = filterType === 'all' ||
      (filterType === 'owner' && resident.residency_type === 'owner-living') ||
      (filterType === 'rented' && resident.residency_type === 'rented');
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (residentId: string) => {
    navigate(`/residents/${residentId}`);
  };

  const handleEdit = (residentId: string) => {
    navigate(`/residents/${residentId}/edit`);
  };

  const handleDeleteClick = (residentId: string) => {
    setResidentToDelete(residentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!residentToDelete) return;

    try {
      const { error } = await supabase
        .from('residents')
        .delete()
        .eq('id', residentToDelete);

      if (error) {
        console.error('Error deleting resident:', error);
        toast.error('Failed to delete resident');
        return;
      }

      toast.success('Resident deleted successfully');
      setDeleteDialogOpen(false);
      setResidentToDelete(null);
      fetchResidents(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete resident');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-6 border border-gray-200/50 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
          <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] to-purple-600 bg-clip-text text-transparent mb-2">
                Residents
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
              Manage society residents and their information
            </p>
          </div>
          {isAdminOrReceptionist() && (
              <Button 
                onClick={() => navigate('/residents/create')} 
                className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 transition-all duration-300 hover:scale-105 active:scale-95 px-6 py-6 h-auto"
              >
                <Plus className="mr-2 h-5 w-5" />
                <span className="font-semibold">Add Resident</span>
          </Button>
          )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Total Residents',
              value: residents.length,
              subtitle: 'Registered residents',
              icon: Users,
              gradient: 'from-[#8c52ff] to-purple-600',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              iconBg: 'bg-[#8c52ff]/10',
              iconColor: 'text-[#8c52ff]',
            },
            {
              title: 'Active',
              value: residents.filter(r => getStatus(r) === 'active').length,
              subtitle: 'Currently active',
              icon: UserCheck,
              gradient: 'from-green-500 to-emerald-600',
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
              iconBg: 'bg-green-500/10',
              iconColor: 'text-green-600 dark:text-green-400',
            },
            {
              title: 'Owner Occupied',
              value: residents.filter(r => r.residency_type === 'owner-living').length,
              subtitle: 'Owner living',
              icon: Home,
              gradient: 'from-blue-500 to-cyan-600',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              iconBg: 'bg-blue-500/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
            },
            {
              title: 'Rented',
              value: residents.filter(r => r.residency_type === 'rented').length,
              subtitle: 'Rental properties',
              icon: Building2,
              gradient: 'from-orange-500 to-amber-600',
              bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
              iconBg: 'bg-orange-500/10',
              iconColor: 'text-orange-600 dark:text-orange-400',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
            <Card
              key={card.title}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
              >
                {/* Animated gradient background */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  card.bgGradient
                )} />
                
                {/* Left accent bar with gradient */}
                <div className={cn(
                  'absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b transition-all duration-500 group-hover:w-2',
                  card.gradient
                )} />
                
                {/* Decorative corner element */}
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
                      'text-4xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
                      card.gradient
                    )}>
                  <CountUpNumber value={card.value} />
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

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search residents or flat number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(value: 'all' | 'owner' | 'rented') => setFilterType(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="owner">Owner Living</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Residents Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                </div>
                <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading residents...</span>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                    <TableHead className="w-[200px] font-semibold text-gray-900 dark:text-gray-100 py-4">Owner Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Flat Number</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Residency Type</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Phone Number</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Registered Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Residents Count</TableHead>
                    <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredResidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-16">
                          <div className="flex flex-col items-center">
                            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                              <Users className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No residents found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new resident.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResidents.map((resident, idx) => {
                        const status = getStatus(resident);
                        const residentsCount = resident.residents_living?.length || 0;
                        return (
                    <TableRow 
                      key={resident.id} 
                      className="group border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300"
                    >
                      <TableCell className="py-4">
                        <button
                          onClick={() => handleViewDetails(resident.id)}
                          className="text-left font-semibold text-gray-900 dark:text-gray-100 hover:text-[#8c52ff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#8c52ff]/20 rounded px-2 py-1 -ml-2"
                        >
                          {resident.owner_name}
                        </button>
                      </TableCell>
                      <TableCell className="py-4">
                        <button
                          onClick={() => handleViewDetails(resident.id)}
                          className="hover:opacity-80 transition-opacity focus:outline-none"
                        >
                          <Badge 
                            variant="outline" 
                            className="border-[#8c52ff]/30 text-[#8c52ff] bg-[#8c52ff]/5 font-medium px-3 py-1"
                          >
                            {resident.flat_number}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={resident.residency_type === 'owner-living' ? 'default' : 'secondary'}
                          className={cn(
                            'font-medium px-3 py-1',
                            resident.residency_type === 'owner-living'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                          )}
                        >
                          {getResidencyTypeDisplay(resident.residency_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-gray-700 dark:text-gray-300 font-medium">
                        {resident.phone_number}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={status === 'active' ? 'default' : 'secondary'}
                          className={cn(
                            'font-medium px-3 py-1',
                            status === 'active'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                          )}
                        >
                          <span className="capitalize">{status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-gray-600 dark:text-gray-400 font-medium">
                        {new Date(resident.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant="outline" 
                          className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 font-medium px-3 py-1"
                        >
                          {residentsCount} resident{residentsCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(resident.id)}
                            className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdminOrReceptionist() && (
                            <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(resident.id)}
                            className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(resident.id)}
                            className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                        );
                      })
                    )}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>

        {!isLoading && filteredResidents.length === 0 && residents.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No residents found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding a new resident.
            </p>
            {isAdminOrReceptionist() && (
              <Button onClick={() => navigate('/residents/create')} className="mt-4 bg-[#8c52ff] hover:bg-[#7a45e6] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Resident
              </Button>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the resident
                and all associated data from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setResidentToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}