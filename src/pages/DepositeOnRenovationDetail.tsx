import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft, Edit, Phone, Calendar, DollarSign, FileText, Loader2, Trash2, User, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DepositeOnRenovation {
  id: string;
  resident_id: string | null;
  flat_number: string;
  resident_name: string;
  owner_name: string | null;
  phone_number: string | null;
  amount: number;
  deposit_date: string;
  status: 'pending' | 'refunded' | 'forfeited';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function DepositeOnRenovationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deposit, setDeposit] = useState<DepositeOnRenovation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeposit(id);
    }
  }, [id]);

  const fetchDeposit = async (depositId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('deposite_on_renovation')
        .select(`
          *,
          residents:resident_id (
            id,
            owner_name,
            flat_number
          )
        `)
        .eq('id', depositId)
        .single();

      if (error) {
        console.error('Error fetching deposit:', error);
        toast.error('Failed to load deposit details');
        navigate('/expenses/deposite-on-renovation');
        return;
      }

      const formattedData = {
        id: data.id,
        resident_id: data.resident_id,
        flat_number: data.residents?.flat_number || data.flat_number || 'N/A',
        resident_name: data.residents?.owner_name || data.owner_name || 'N/A',
        owner_name: data.owner_name || data.residents?.owner_name || null,
        phone_number: data.phone_number || data.residents?.phone_number || null,
        amount: data.amount,
        deposit_date: data.deposit_date,
        status: data.status,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setDeposit(formattedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load deposit details');
      navigate('/expenses/deposite-on-renovation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deposit) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('deposite_on_renovation')
        .delete()
        .eq('id', deposit.id);

      if (error) throw error;

      toast.success('Deposit deleted successfully');
      navigate('/expenses/deposite-on-renovation');
    } catch (error: any) {
      console.error('Error deleting deposit:', error);
      toast.error('Failed to delete deposit');
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
          <span className="ml-2 text-muted-foreground">Loading deposit details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!deposit) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Deposit Not Found</h3>
            <p className="text-muted-foreground">The requested deposit could not be found.</p>
            <Button onClick={() => navigate('/expenses/deposite-on-renovation')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deposits
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
              <Button variant="outline" size="sm" onClick={() => navigate('/expenses/deposite-on-renovation')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Deposits
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Deposit Details
                </h1>
                <p className="text-muted-foreground">
                  View complete information about the renovation deposit
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/expenses/deposite-on-renovation/${id}/edit`)}
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

        {/* Deposit Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5 text-[#8c52ff]" />
              Deposit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#8c52ff]" />
                  Flat Number
                </Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{deposit.flat_number}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#8c52ff]" />
                  Owner Name
                </Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{deposit.owner_name || deposit.resident_name || '-'}</p>
              </div>
              {deposit.phone_number && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Phone Number
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{deposit.phone_number}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#8c52ff]" />
                  Amount
                </Label>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{deposit.amount.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#8c52ff]" />
                  Deposit Date
                </Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(deposit.deposit_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </Label>
                <Badge
                  className={cn(
                    "px-3 py-1 text-sm font-medium",
                    deposit.status === 'pending'
                      ? "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800"
                      : deposit.status === 'refunded'
                        ? "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-800"
                        : "bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800"
                  )}
                >
                  {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                </Badge>
              </div>
              {deposit.notes && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#8c52ff]" />
                    Notes
                  </Label>
                  <p className="text-base text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    {deposit.notes}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Created At
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(deposit.created_at).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Last Updated
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(deposit.updated_at).toLocaleString('en-US', { 
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
                This action cannot be undone. This will permanently delete the deposit
                for <strong>{deposit.flat_number}</strong> (₹{deposit.amount.toLocaleString()}).
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

