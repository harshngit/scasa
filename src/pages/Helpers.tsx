import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Trash2,
  HandHeart,
  Phone,
  Mail,
  Users,
  Loader2,
  Eye,
  TrendingUp,
  User,
  UserCheck,
  Edit
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCurrentUser, isAdminOrReceptionist } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Helper {
  id: string;
  name: string;
  phone: string | null;
  helper_type: string | null;
  rooms: string[] | null;
  notes: string | null;
  gender: string | null;
  photo_url: string | null;
  created_at: string;
}

export default function Helpers() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteHelperId, setDeleteHelperId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('helpers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHelpers(data || []);
    } catch (error: any) {
      console.error('Error fetching helpers:', error);
      toast.error('Failed to fetch helpers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (helperId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('helpers')
        .delete()
        .eq('id', helperId);

      if (error) throw error;

      toast.success('Helper deleted successfully');
      fetchHelpers();
      setDeleteHelperId(null);
    } catch (error: any) {
      console.error('Error deleting helper:', error);
      toast.error('Failed to delete helper');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredHelpers = helpers.filter(helper => {
    const query = searchTerm.toLowerCase();
    return (
      helper.name.toLowerCase().includes(query) ||
      (helper.phone && helper.phone.includes(query)) ||
      (helper.helper_type && helper.helper_type.toLowerCase().includes(query)) ||
      (helper.notes && helper.notes.toLowerCase().includes(query))
    );
  });

  const stats = {
    total: helpers.length,
    totalMen: helpers.filter(h => h.gender?.toLowerCase() === 'male' || h.gender?.toLowerCase() === 'man').length,
    totalWomen: helpers.filter(h => h.gender?.toLowerCase() === 'female' || h.gender?.toLowerCase() === 'woman').length,
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center justify-between">
            {/* Left Side - Content */}
            <div className="flex-1 animate-fade-in">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-gradient">
                Helper Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage helpers and link them to the flats/rooms they work in
              </p>
            </div>

            {/* Right Side - Buttons */}
            {isAdminOrReceptionist() && (
              <div className="ml-6 flex gap-3 animate-slide-in-right">
                <Button 
                  onClick={() => navigate('/helpers/create')}
                  className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 transition-all duration-300 hover:scale-105 active:scale-95 px-6 py-6 h-auto"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Add Helper</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Total Helpers',
              value: stats.total,
              subtitle: 'Registered helpers',
              icon: HandHeart,
              gradient: 'from-[#8c52ff] to-purple-600',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              iconBg: 'bg-[#8c52ff]/10',
              iconColor: 'text-[#8c52ff]',
            },
            {
              title: 'Total Men',
              value: stats.totalMen,
              subtitle: 'Male helpers',
              icon: User,
              gradient: 'from-blue-500 to-cyan-600',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              iconBg: 'bg-blue-500/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
            },
            {
              title: 'Total Women',
              value: stats.totalWomen,
              subtitle: 'Female helpers',
              icon: UserCheck,
              gradient: 'from-pink-500 to-rose-600',
              bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20',
              iconBg: 'bg-pink-500/10',
              iconColor: 'text-pink-600 dark:text-pink-400',
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
                      'text-3xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
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

        {/* Search */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search helpers by name, phone, type, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Helpers Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                </div>
                <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading helpers...</span>
              </div>
            ) : filteredHelpers.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <HandHeart className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No helpers found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new helper.'}
                  </p>
                  {!searchTerm && isAdminOrReceptionist() && (
                    <Button 
                      onClick={() => navigate('/helpers/create')} 
                      className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Helper
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Helper Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Phone Number</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Type</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Gender</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Rooms / Flats</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Notes</TableHead>
                      <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHelpers.map((helper, idx) => (
                      <TableRow 
                        key={helper.id}
                        className={cn(
                          "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                          "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                          idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                        )}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={helper.photo_url || undefined} alt={helper.name} />
                              <AvatarFallback className="bg-gradient-to-br from-[#8c52ff] to-purple-600 text-white font-semibold">
                                {helper.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{helper.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{helper.phone || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                            variant="outline" 
                            className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 font-medium px-3 py-1"
                          >
                            {helper.helper_type || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "font-medium px-3 py-1",
                              helper.gender?.toLowerCase() === 'male' || helper.gender?.toLowerCase() === 'man'
                                ? "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                                : helper.gender?.toLowerCase() === 'female' || helper.gender?.toLowerCase() === 'woman'
                                ? "border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20"
                                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
                            )}
                          >
                            {helper.gender || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          {helper.rooms && helper.rooms.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {helper.rooms.map((room) => (
                                <Badge key={room} variant="outline" className="text-xs border-gray-300 dark:border-gray-700">
                                  {room}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Not linked</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate block">
                            {helper.notes || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/helpers/${helper.id}`)}
                              title="View Helper"
                              className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdminOrReceptionist() && (
                              <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/helpers/${helper.id}/edit`)}
                              title="Edit Helper"
                              className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteHelperId(helper.id)}
                                    disabled={isDeleting}
                                    title="Delete Helper"
                                    className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the helper
                                      <strong> {helper.name}</strong> and all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteHelperId(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(helper.id)}
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
                              </>
                            )}
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
      </div>
    </DashboardLayout>
  );
}
