import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, TrendingUp, TrendingDown, DollarSign, Calendar, Building2, Home, Receipt, ArrowUpDown, Plus, CreditCard } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FinanceTransaction {
  id: string;
  type: 'maintenance' | 'vendor' | 'deposit' | 'society_room';
  date: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  reference: string;
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

interface Vendor {
  id: string;
  vendor_name: string;
  outstanding_bill: number;
}

export default function Finance() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'maintenance' | 'vendor' | 'deposit' | 'society_room'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Make Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchAllFinanceData();
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_name, outstanding_bill')
        .order('vendor_name', { ascending: true });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchAllFinanceData = async () => {
    try {
      setIsLoading(true);
      const allTransactions: FinanceTransaction[] = [];

      // Fetch Maintenance Payments (Credits - Income)
      const { data: maintenancePayments, error: maintenanceError } = await supabase
        .from('maintenance_payments')
        .select('*')
        .eq('status', 'paid')
        .order('paid_date', { ascending: false });

      if (!maintenanceError && maintenancePayments) {
        maintenancePayments.forEach((payment) => {
          allTransactions.push({
            id: payment.id,
            type: 'maintenance',
            date: payment.paid_date || payment.created_at,
            description: `Maintenance Payment - ${payment.flat_number}`,
            amount: payment.amount || 0,
            category: 'Maintenance',
            status: payment.status,
            reference: payment.flat_number,
          });
        });
      }

      // Fetch Vendor Invoices (Debits - Expenses)
      const { data: vendorInvoices, error: vendorError } = await supabase
        .from('vendor_invoices')
        .select('*')
        .in('status', ['paid', 'partial'])
        .order('invoice_date', { ascending: false });

      if (!vendorError && vendorInvoices) {
        vendorInvoices.forEach((invoice) => {
          allTransactions.push({
            id: invoice.id,
            type: 'vendor',
            date: invoice.invoice_date,
            description: invoice.description || `Vendor Invoice - ${invoice.invoice_number}`,
            amount: invoice.paid_amount || invoice.amount || 0,
            category: 'Vendor Payment',
            status: invoice.status,
            reference: invoice.invoice_number,
          });
        });
      }

      // Fetch Vendor Billing History (Debits - Expenses)
      const { data: billingHistory, error: billingError } = await supabase
        .from('billing_history')
        .select(`
          *,
          vendors:vendor_id (
            vendor_name
          )
        `)
        .order('payment_date', { ascending: false });

      if (!billingError && billingHistory) {
        billingHistory.forEach((payment) => {
          const vendorName = (payment.vendors as any)?.vendor_name || 'Vendor';
          const paymentModeLabel = payment.payment_mode 
            ? payment.payment_mode.split('_').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            : '';
          const description = paymentModeLabel 
            ? `Vendor Payment - ${vendorName} (${paymentModeLabel})`
            : `Vendor Payment - ${vendorName}`;
          
          allTransactions.push({
            id: payment.id,
            type: 'vendor',
            date: payment.payment_date,
            description: description,
            amount: payment.amount_paid || 0,
            category: 'Vendor Payment',
            status: 'paid',
            reference: vendorName,
          });
        });
      }

      // Fetch Deposits on Renovation (Credits - Income)
      const { data: deposits, error: depositError } = await supabase
        .from('deposite_on_renovation')
        .select('*')
        .order('deposit_date', { ascending: false });

      if (!depositError && deposits) {
        deposits.forEach((deposit) => {
          allTransactions.push({
            id: deposit.id,
            type: 'deposit',
            date: deposit.deposit_date,
            description: `Renovation Deposit - ${deposit.flat_number}`,
            amount: deposit.amount || 0,
            category: 'Deposit',
            status: deposit.status,
            reference: deposit.flat_number,
          });
        });
      }

      // Fetch Society Owned Rooms Finance (Credits - Income)
      const { data: rooms, error: roomError } = await supabase
        .from('society_owned_rooms')
        .select('*')
        .not('finance_money', 'is', null)
        .order('created_at', { ascending: false });

      if (!roomError && rooms) {
        rooms.forEach((room) => {
          if (room.finance_money) {
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthName = room.finance_month ? monthNames[room.finance_month - 1] : '';
            allTransactions.push({
              id: room.id,
              type: 'society_room',
              date: room.created_at,
              description: `Room Rent - ${room.room_number}${monthName ? ` (${monthName})` : ''}`,
              amount: room.finance_money,
              category: 'Room Rent',
              status: room.status,
              reference: room.room_number,
            });
          }
        });
      }

      // Sort by date
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const credits = filteredTransactions
    .filter(t => ['maintenance', 'deposit', 'society_room'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const debits = filteredTransactions
    .filter(t => t.type === 'vendor')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = credits - debits;

  const maintenanceTotal = filteredTransactions
    .filter(t => t.type === 'maintenance')
    .reduce((sum, t) => sum + t.amount, 0);

  const vendorTotal = filteredTransactions
    .filter(t => t.type === 'vendor')
    .reduce((sum, t) => sum + t.amount, 0);

  const depositTotal = filteredTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const roomTotal = filteredTransactions
    .filter(t => t.type === 'society_room')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const creditTransactions = filteredTransactions.filter(t => 
    ['maintenance', 'deposit', 'society_room'].includes(t.type)
  );
  
  const debitTransactions = filteredTransactions.filter(t => 
    t.type === 'vendor'
  );

  const sortedCreditTransactions = [...creditTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
  });

  const sortedDebitTransactions = [...debitTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
  });

  const handleMakePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const amount = parseFloat(paymentAmount);

      // Get vendor details
      const vendor = vendors.find(v => v.id === selectedVendor);
      if (!vendor) {
        toast.error('Vendor not found');
        return;
      }

      // Update vendor billing
      const newPaidBill = (vendor.outstanding_bill || 0) + amount;
      const newOutstandingBill = Math.max(0, (vendor.outstanding_bill || 0) - amount);

      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          paid_bill: newPaidBill,
          outstanding_bill: newOutstandingBill,
        })
        .eq('id', selectedVendor);

      if (updateError) throw updateError;

      // Save to billing_history
      const { error: historyError } = await supabase
        .from('billing_history')
        .insert({
          vendor_id: selectedVendor,
          amount_paid: amount,
          payment_date: paymentDate,
          payment_mode: paymentMode,
          payment_details: paymentDetails || null,
          notes: paymentNotes || null,
        });

      if (historyError) throw historyError;

      toast.success(`Payment of ₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} recorded successfully`);

      // Reset form
      setPaymentAmount('');
      setPaymentDetails('');
      setPaymentMode('');
      setPaymentNotes('');
      setSelectedVendor('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setShowPaymentForm(false);

      // Refresh data
      await fetchAllFinanceData();
      await fetchVendors();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const renderTransactionsTable = (transactions: FinanceTransaction[]) => {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Receipt className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No transactions found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filter.' : 'No transactions available yet.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Date</TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Description</TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Reference</TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Category</TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, idx) => {
              const isCredit = ['maintenance', 'deposit', 'society_room'].includes(transaction.type);
              return (
                <TableRow
                  key={transaction.id}
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                    "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                    idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                  )}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 dark:text-gray-300">{transaction.reference}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 dark:text-gray-300">{transaction.category}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      className={cn(
                        "px-3 py-1 text-xs font-medium",
                        transaction.status === 'paid' || transaction.status === 'refunded'
                          ? "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-800"
                          : transaction.status === 'pending'
                            ? "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800"
                            : "bg-gray-100 dark:bg-gray-950/20 text-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-800"
                      )}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <span className={cn(
                      "font-bold text-lg",
                      isCredit
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

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
                Finance
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Complete financial overview of all transactions
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Total Credits',
              value: credits,
              subtitle: 'Income received',
              icon: TrendingUp,
              gradient: 'from-emerald-500 to-teal-600',
              bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
              iconBg: 'bg-emerald-500/10',
              iconColor: 'text-emerald-600 dark:text-emerald-400',
              format: 'currency',
            },
            {
              title: 'Total Debits',
              value: debits,
              subtitle: 'Expenses paid',
              icon: TrendingDown,
              gradient: 'from-red-500 to-rose-600',
              bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
              iconBg: 'bg-red-500/10',
              iconColor: 'text-red-600 dark:text-red-400',
              format: 'currency',
            },
            {
              title: 'Balance',
              value: balance,
              subtitle: 'Net amount',
              icon: DollarSign,
              gradient: balance >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-amber-600',
              bgGradient: balance >= 0 ? 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' : 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
              iconBg: balance >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
              iconColor: balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400',
              format: 'currency',
            },
            {
              title: 'Transactions',
              value: filteredTransactions.length,
              subtitle: 'Total records',
              icon: Receipt,
              gradient: 'from-purple-500 to-indigo-600',
              bgGradient: 'from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20',
              iconBg: 'bg-purple-500/10',
              iconColor: 'text-purple-600 dark:text-purple-400',
              format: 'number',
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
                        <>₹<CountUpNumber value={Math.abs(card.value)} /></>
                      ) : (
                        <CountUpNumber value={card.value} />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Category Breakdown */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Maintenance',
              value: maintenanceTotal,
              icon: Building2,
              gradient: 'from-blue-500 to-cyan-600',
            },
            {
              title: 'Vendors',
              value: vendorTotal,
              icon: Receipt,
              gradient: 'from-red-500 to-rose-600',
            },
            {
              title: 'Deposits',
              value: depositTotal,
              icon: Home,
              gradient: 'from-green-500 to-emerald-600',
            },
            {
              title: 'Room Rent',
              value: roomTotal,
              icon: Building2,
              gradient: 'from-purple-500 to-indigo-600',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                      <p className={cn(
                        'text-2xl font-bold mt-1 bg-gradient-to-r bg-clip-text text-transparent',
                        card.gradient
                      )}>
                        ₹{card.value.toLocaleString()}
                      </p>
                    </div>
                    <Icon className={cn('h-8 w-8 opacity-20', `text-${card.gradient.split(' ')[0].split('-')[1]}-500`)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Make a Payment Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#8c52ff] to-purple-600">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Make a Payment</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Record vendor payments (Credit & Debit)</p>
                </div>
              </div>
              <Button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#7a45e6] hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showPaymentForm ? 'Cancel' : 'Make Payment'}
              </Button>
            </div>
          </CardHeader>
          {showPaymentForm && (
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Vendor Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Select Vendor *</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.vendor_name} {vendor.outstanding_bill > 0 && `(Outstanding: ₹${vendor.outstanding_bill.toLocaleString()})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Amount (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payment Date *</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    />
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payment Mode *</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Details */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payment Details</Label>
                  <Textarea
                    placeholder="Enter payment details (e.g., cheque number, transaction ID, UPI reference, etc.)"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    className="min-h-[100px] text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any additional notes..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="min-h-[100px] text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount('');
                      setPaymentDetails('');
                      setPaymentMode('');
                      setPaymentNotes('');
                      setSelectedVendor('');
                      setPaymentDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="h-12 px-6 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMakePayment}
                    disabled={isSubmittingPayment}
                    className="h-12 px-6 bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#7a45e6] hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Record Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="society_room">Room Rent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSort('date')}
                  className="h-12 flex-1 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                  {sortBy === 'date' && (
                    <ArrowUpDown className={cn('h-4 w-4 ml-2', sortOrder === 'asc' && 'rotate-180')} />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSort('amount')}
                  className="h-12 flex-1 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Amount
                  {sortBy === 'amount' && (
                    <ArrowUpDown className={cn('h-4 w-4 ml-2', sortOrder === 'asc' && 'rotate-180')} />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table with Tabs */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                </div>
                <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading transactions...</span>
              </div>
            ) : (
              <Tabs defaultValue="credit" className="w-full">
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 via-purple-50/30 to-pink-50/20 dark:from-gray-800 dark:via-purple-950/20 dark:to-pink-950/20 px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Transaction Details</h2>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 animate-pulse"></div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Credit: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{credits.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 animate-pulse"></div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Debit: <span className="font-bold text-red-600 dark:text-red-400">₹{debits.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-white dark:bg-gray-800 p-1.5 text-gray-600 dark:text-gray-400 shadow-lg border border-gray-200 dark:border-gray-700">
                    <TabsTrigger 
                      value="credit" 
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3.5 text-base font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600",
                        "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-emerald-500/40 data-[state=active]:scale-105",
                        "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-105",
                        "data-[state=active]:hover:bg-gradient-to-r data-[state=active]:hover:from-emerald-600 data-[state=active]:hover:to-teal-700",
                        "relative overflow-hidden group"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <TrendingUp className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">Credit</span>
                      <Badge className="ml-3 px-2.5 py-1 text-xs font-bold bg-white/30 text-white border-white/40 backdrop-blur-sm relative z-10">
                        {creditTransactions.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="debit"
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3.5 text-base font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600",
                        "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/40 data-[state=active]:scale-105",
                        "hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:scale-105",
                        "data-[state=active]:hover:bg-gradient-to-r data-[state=active]:hover:from-red-600 data-[state=active]:hover:to-rose-700",
                        "relative overflow-hidden group"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <TrendingDown className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">Debit</span>
                      <Badge className="ml-3 px-2.5 py-1 text-xs font-bold bg-white/30 text-white border-white/40 backdrop-blur-sm relative z-10">
                        {debitTransactions.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="credit" className="p-6 m-0 space-y-4">
                  <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Credit Transactions</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">All income and revenue transactions</p>
                      </div>
                    </div>
                    <Badge className="px-4 py-1.5 text-sm font-bold bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      {creditTransactions.length} records
                    </Badge>
                  </div>
                  {renderTransactionsTable(sortedCreditTransactions)}
                </TabsContent>
                <TabsContent value="debit" className="p-6 m-0 space-y-4">
                  <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600">
                        <TrendingDown className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Debit Transactions</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">All expenses and vendor payments</p>
                      </div>
                    </div>
                    <Badge className="px-4 py-1.5 text-sm font-bold bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800">
                      {debitTransactions.length} records
                    </Badge>
                  </div>
                  {renderTransactionsTable(sortedDebitTransactions)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
