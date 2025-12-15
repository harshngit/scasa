import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Trash2,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Loader2,
  CheckCircle,
  Eye,
  FileText,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCurrentUser, isAdminOrReceptionist } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  vendor_name: string;
  email: string;
  phone_number: string;
  work_details: string | null;
  total_bill: number;
  outstanding_bill: number;
  paid_bill: number;
  created_at: string;
}

export default function Vendors() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast.success('Vendor deleted successfully');
      fetchVendors();
      setDeleteVendorId(null);
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPaymentDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setAmountPaid(vendor.outstanding_bill.toString());
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedVendor) return;

    const paidAmount = parseFloat(amountPaid);
    const outstandingAmount = Number(selectedVendor.outstanding_bill);

    if (isNaN(paidAmount) || paidAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paidAmount > outstandingAmount) {
      toast.error('Amount paid cannot exceed outstanding amount');
      return;
    }

    setIsPaying(true);
    try {
      // Calculate new amounts
      const newPaidBill = Number(selectedVendor.paid_bill) + paidAmount;
      const newOutstandingBill = outstandingAmount - paidAmount;

      // Update vendor bills
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          paid_bill: newPaidBill,
          outstanding_bill: newOutstandingBill,
        })
        .eq('id', selectedVendor.id);

      if (updateError) throw updateError;

      // Save to billing_history
      const { error: historyError } = await supabase
        .from('billing_history')
        .insert({
          vendor_id: selectedVendor.id,
          amount_paid: paidAmount,
          payment_date: new Date().toISOString().split('T')[0],
        });

      if (historyError) throw historyError;

      toast.success(`Payment of ₹${paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} recorded successfully`);
      setShowPaymentDialog(false);
      setSelectedVendor(null);
      setAmountPaid('');
      fetchVendors();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const query = searchTerm.toLowerCase();
    return (
      vendor.vendor_name.toLowerCase().includes(query) ||
      vendor.email.toLowerCase().includes(query) ||
      vendor.phone_number.includes(query) ||
      (vendor.work_details && vendor.work_details.toLowerCase().includes(query))
    );
  });

  const stats = {
    total: vendors.length,
    totalBill: vendors.reduce((sum, v) => sum + Number(v.total_bill), 0),
    outstandingBill: vendors.reduce((sum, v) => sum + Number(v.outstanding_bill), 0),
    paidBill: vendors.reduce((sum, v) => sum + Number(v.paid_bill), 0),
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
                Vendor Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage vendors, invoices, and track payments
              </p>
            </div>

            {/* Right Side - Buttons */}
            {isAdminOrReceptionist() && (
              <div className="ml-6 flex gap-3 animate-slide-in-right">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/vendors/create-invoice')}
                  className="border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-5 py-6 h-auto"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Create Invoice</span>
                </Button>
                <Button 
                  onClick={() => navigate('/vendors/create')}
                  className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 transition-all duration-300 hover:scale-105 active:scale-95 px-6 py-6 h-auto"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Add Vendor</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Total Vendors',
              value: stats.total,
              subtitle: 'Registered vendors',
              icon: Building2,
              gradient: 'from-[#8c52ff] to-purple-600',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              iconBg: 'bg-[#8c52ff]/10',
              iconColor: 'text-[#8c52ff]',
              isCurrency: false,
            },
            {
              title: 'Total Bill',
              value: stats.totalBill,
              subtitle: 'All time',
              icon: DollarSign,
              gradient: 'from-blue-500 to-cyan-600',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              iconBg: 'bg-blue-500/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
              isCurrency: true,
            },
            {
              title: 'Outstanding Bill',
              value: stats.outstandingBill,
              subtitle: 'Pending payment',
              icon: DollarSign,
              gradient: 'from-orange-500 to-amber-600',
              bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
              iconBg: 'bg-orange-500/10',
              iconColor: 'text-orange-600 dark:text-orange-400',
              isCurrency: true,
            },
            {
              title: 'Paid Bill',
              value: stats.paidBill,
              subtitle: 'Total paid',
              icon: DollarSign,
              gradient: 'from-green-500 to-emerald-600',
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
              iconBg: 'bg-green-500/10',
              iconColor: 'text-green-600 dark:text-green-400',
              isCurrency: true,
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
                      {card.isCurrency ? (
                        <>₹<CountUpNumber value={Math.round(card.value)} /></>
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

        {/* Search */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search vendors by name, email, phone, or work details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                </div>
                <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading vendors...</span>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Building2 className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No vendors found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new vendor.'}
                  </p>
                  {!searchTerm && isAdminOrReceptionist() && (
                    <Button 
                      onClick={() => navigate('/vendors/create')} 
                      className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Vendor
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Vendor Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Email</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Phone Number</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Work Details</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Total Bill</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Outstanding Bill</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Paid Bill</TableHead>
                      <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor, idx) => (
                      <TableRow 
                        key={vendor.id}
                        className={cn(
                          "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                          "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                          idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                        )}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8c52ff] to-purple-600 flex items-center justify-center text-white font-semibold">
                              {vendor.vendor_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{vendor.vendor_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{vendor.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{vendor.phone_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                            variant="outline" 
                            className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 font-medium px-3 py-1 max-w-xs truncate"
                            title={vendor.work_details || ''}
                          >
                            {vendor.work_details || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            ₹<CountUpNumber value={Math.round(Number(vendor.total_bill))} />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-orange-600 dark:text-orange-400">
                            ₹<CountUpNumber value={Math.round(Number(vendor.outstanding_bill))} />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            ₹<CountUpNumber value={Math.round(Number(vendor.paid_bill))} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/vendors/${vendor.id}`)}
                              title="View Vendor"
                              className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdminOrReceptionist() && (
                              <>
                            {Number(vendor.outstanding_bill) > 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenPaymentDialog(vendor)}
                                disabled={isPaying}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold h-9"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Paid
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteVendorId(vendor.id)}
                                  disabled={isDeleting}
                                  title="Delete Vendor"
                                  className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the vendor
                                  <strong> {vendor.vendor_name}</strong> and all associated invoices.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteVendorId(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(vendor.id)}
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

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Enter the payment details for the vendor
              </DialogDescription>
            </DialogHeader>
            {selectedVendor && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Vendor Name</Label>
                    <div className="font-medium">{selectedVendor.vendor_name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="text-sm">{selectedVendor.email}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <div className="text-sm">{selectedVendor.phone_number}</div>
                  </div>
                  {selectedVendor.work_details && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Work Details</Label>
                      <div className="text-sm">{selectedVendor.work_details}</div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Outstanding Amount</Label>
                    <div className="text-lg font-bold text-orange-600">
                      ₹{Number(selectedVendor.outstanding_bill).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Amount Paid *</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Enter amount paid"
                      min="0"
                      max={selectedVendor.outstanding_bill}
                      step="0.01"
                      disabled={isPaying}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum: ₹{Number(selectedVendor.outstanding_bill).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setSelectedVendor(null);
                  setAmountPaid('');
                }}
                disabled={isPaying}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitPayment} disabled={isPaying}>
                {isPaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit Payment'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
