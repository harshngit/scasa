import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Search, Trash2, Shield, UserCheck, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface User {
  user_id: string;
  user_name: string;
  email: string;
  mobile_number: string | null;
  role: 'admin' | 'receptionist' | 'resident';
  flat_no: string | null;
  created_at: string;
}

export default function UsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User deleted successfully');
      fetchUsers();
      setDeleteUserId(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'receptionist':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'resident':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      admin: 'default',
      receptionist: 'secondary',
      resident: 'outline',
    };

    return (
      <Badge variant={variants[role] || 'outline'} className="capitalize">
        {getRoleIcon(role)}
        <span className="ml-1">{role}</span>
      </Badge>
    );
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.user_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.mobile_number && user.mobile_number.includes(query)) ||
      (user.flat_no && user.flat_no.toLowerCase().includes(query))
    );
  });

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    receptionist: users.filter((u) => u.role === 'receptionist').length,
    resident: users.filter((u) => u.role === 'resident').length,
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage all system users</p>
          </div>
          <Button onClick={() => navigate('/users/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              title: 'Total Users',
              value: stats.total,
              subtitle: 'All system users',
              color: 'text-black',
              iconColor: 'text-[#8c52ff]',
              icon: Users,
              bgColor: 'bg-[#8c52ff]',
            },
            {
              title: 'Admins',
              value: stats.admin,
              subtitle: 'Administrators',
              color: 'text-black',
              iconColor: 'text-[#8c52ff]',
              icon: Shield,
              bgColor: 'bg-[#8c52ff]',
            },
            {
              title: 'Receptionists',
              value: stats.receptionist,
              subtitle: 'Staff members',
              color: 'text-black',
              iconColor: 'text-[#8c52ff]',
              icon: UserCheck,
              bgColor: 'bg-[#8c52ff]',
            },
            {
              title: 'Residents',
              value: stats.resident,
              subtitle: 'Society residents',
              color: 'text-black',
              iconColor: 'text-[#8c52ff]',
              icon: Users,
              bgColor: 'bg-[#8c52ff]',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="relative overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#8c52ff]/30"
              >
                <div className={cn('absolute left-0 top-0 h-full w-1', card.bgColor)} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-black">{card.title}</CardTitle>
                  <Icon className={cn('h-4 w-4', card.iconColor)} />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className={cn('text-3xl font-bold tracking-tight', card.color)}>
                    <CountUpNumber value={card.value} />
                  </div>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Flat No</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.user_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile_number || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.flat_no || '-'}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteUserId(user.user_id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user
                                <strong> {user.user_name}</strong> from the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteUserId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.user_id)}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

