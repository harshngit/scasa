import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Download,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Plus,
  Receipt,
  X,
  Eye,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generateInvoice, generateAllInvoices } from '@/lib/invoice-generator';
import { generateReceipt, generateAllReceipts } from '@/lib/receipt-generator';
import { getCurrentUser, isAdminOrReceptionist } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface MaintenancePayment {
  id: string;
  resident_id: string | null;
  flat_number: string;
  resident_name: string;
  month: number;
  year: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  payment_method: string | null;
  receipt_number: string | null;
  late_fee: number;
  notes: string | null;
  created_at: string;
}

interface Resident {
  id: string;
  flat_number: string;
  owner_name: string;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function MaintenancePayments() {
  const currentUser = getCurrentUser();
  const [payments, setPayments] = useState<MaintenancePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<MaintenancePayment | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingMonth, setGeneratingMonth] = useState<number>(new Date().getMonth() + 1);
  const [generatingYear, setGeneratingYear] = useState<number>(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentForPayment, setSelectedPaymentForPayment] = useState<MaintenancePayment | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Preview Invoice Dialog State
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [invoiceCharges, setInvoiceCharges] = useState([
    { id: '1', label: 'REPAIR & MAINTAINANCE', amount: 460 },
    { id: '2', label: 'SERVICE CHARGES', amount: 1865 },
    { id: '3', label: 'SINKING FUND', amount: 75 },
    { id: '4', label: 'TMC TAXES PROPERTY/WATER', amount: 650 },
    { id: '5', label: 'FEDERATION CHARGES', amount: 800 },
  ]);
  const [customTotal, setCustomTotal] = useState<number | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_payments')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('flat_number', { ascending: true });

      if (error) throw error;

      // Update status based on due date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedPayments = (data || []).map(payment => {
        const dueDate = new Date(payment.due_date);
        dueDate.setHours(0, 0, 0, 0);

        let status = payment.status;
        if (status === 'unpaid' && dueDate < today) {
          status = 'overdue';
        }

        return { ...payment, status };
      });

      setPayments(updatedPayments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch maintenance payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewInvoice = () => {
    // Calculate current total
    const currentTotal = invoiceCharges.reduce((sum, charge) => sum + charge.amount, 0);
    setCustomTotal(currentTotal);
    setShowGenerateDialog(false);
    setShowPreviewDialog(true);
  };

  const handleAddChargeField = () => {
    const newId = String(Date.now());
    setInvoiceCharges([...invoiceCharges, { id: newId, label: '', amount: 0 }]);
  };

  const handleRemoveChargeField = (id: string) => {
    if (invoiceCharges.length > 1) {
      setInvoiceCharges(invoiceCharges.filter(charge => charge.id !== id));
    } else {
      toast.error('At least one charge field is required');
    }
  };

  const handleUpdateCharge = (id: string, field: 'label' | 'amount', value: string | number) => {
    setInvoiceCharges(invoiceCharges.map(charge =>
      charge.id === id ? { ...charge, [field]: value } : charge
    ));
    // Reset custom total when charges change
    setCustomTotal(null);
  };

  const calculateTotal = () => {
    if (customTotal !== null) return customTotal;
    return invoiceCharges.reduce((sum, charge) => sum + charge.amount, 0);
  };

  const handleUpdateTotal = (newTotal: number) => {
    setCustomTotal(newTotal);
    // Adjust service charges to match the new total
    const currentTotal = invoiceCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const difference = newTotal - currentTotal;

    // Find service charges field or use first field
    const serviceChargeIndex = invoiceCharges.findIndex(c =>
      c.label.toUpperCase().includes('SERVICE')
    );
    const indexToAdjust = serviceChargeIndex >= 0 ? serviceChargeIndex : 1;

    setInvoiceCharges(invoiceCharges.map((charge, index) =>
      index === indexToAdjust
        ? { ...charge, amount: Math.max(0, charge.amount + difference) }
        : charge
    ));
  };

  const generatePaymentsForMonth = async () => {
    try {
      setIsGenerating(true);

      // Fetch all residents
      const { data: residents, error: residentsError } = await supabase
        .from('residents')
        .select('id, flat_number, owner_name');

      if (residentsError) throw residentsError;

      if (!residents || residents.length === 0) {
        toast.error('No residents found. Please add residents first.');
        return;
      }

      // Check if payments already exist for this month/year
      const { data: existingPayments, error: checkError } = await supabase
        .from('maintenance_payments')
        .select('flat_number')
        .eq('month', generatingMonth)
        .eq('year', generatingYear);

      if (checkError) throw checkError;

      const existingFlats = new Set(existingPayments?.map(p => p.flat_number) || []);

      // Calculate due date (5th of the month)
      const dueDate = new Date(generatingYear, generatingMonth - 1, 5);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Use the calculated total from invoice charges
      const totalAmount = calculateTotal();

      // Generate payments for each resident
      const newPayments = residents
        .filter(resident => !existingFlats.has(resident.flat_number))
        .map(resident => ({
          resident_id: resident.id,
          flat_number: resident.flat_number,
          resident_name: resident.owner_name,
          month: generatingMonth,
          year: generatingYear,
          amount: totalAmount,
          due_date: dueDateStr,
          status: 'unpaid' as const,
        }));

      if (newPayments.length === 0) {
        toast.info(`Maintenance payments for ${months[generatingMonth - 1]} ${generatingYear} already exist for all flats.`);
        setShowPreviewDialog(false);
        return;
      }

      // Insert payments
      const { error: insertError } = await supabase
        .from('maintenance_payments')
        .insert(newPayments);

      if (insertError) throw insertError;

      toast.success(`Generated ${newPayments.length} maintenance payment(s) for ${months[generatingMonth - 1]} ${generatingYear}`);
      setShowPreviewDialog(false);
      fetchPayments();
    } catch (error: any) {
      console.error('Error generating payments:', error);
      toast.error('Failed to generate maintenance payments');
    } finally {
      setIsGenerating(false);
    }
  };

  const statusStyles: Record<string, { icon: any; className: string }> = {
    paid: {
      icon: CheckCircle,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    unpaid: {
      icon: Clock,
      className: 'border-slate-200 bg-slate-100 text-slate-700',
    },
    overdue: {
      icon: AlertTriangle,
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    partial: {
      icon: Clock,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusStyles[status] || statusStyles.unpaid;
    const Icon = config.icon;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize',
          config.className
        )}
      >
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.resident_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMonth = filterMonth === 'all' || months[payment.month - 1] === filterMonth;
    const matchesYear = filterYear === 'all' || payment.year.toString() === filterYear;

    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount + (payment.late_fee || 0), 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.amount + (payment.late_fee || 0), 0);
  const unpaidAmount = payments.filter(p => p.status !== 'paid').reduce((sum, payment) => sum + payment.amount + (payment.late_fee || 0), 0);
  const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((sum, payment) => sum + payment.amount + (payment.late_fee || 0), 0);

  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const downloadReceipt = (payment: MaintenancePayment) => {
    if (!payment.receipt_number || !payment.paid_date) {
      toast.error('Receipt cannot be generated. Payment details are incomplete.');
      return;
    }

    try {
      // Parse flat number to extract building and floor if possible
      const flatParts = payment.flat_number.split('/');
      const buildingNumber = flatParts.length > 0 ? flatParts[0].charAt(0) : undefined;
      const floor = flatParts.length > 1 ? flatParts[0].slice(1) : undefined;

      // Format dates
      const paidDate = new Date(payment.paid_date);
      const receiptDate = `${String(paidDate.getDate()).padStart(2, '0')}.${String(paidDate.getMonth() + 1).padStart(2, '0')}.${paidDate.getFullYear()}`;

      // Generate bill number from payment ID or use receipt number
      const billNumber = payment.receipt_number || `BILL-${payment.id.slice(0, 8).toUpperCase()}`;
      const billDate = `${String(new Date(payment.due_date).getDate()).padStart(2, '0')}.${String(new Date(payment.due_date).getMonth() + 1).padStart(2, '0')}.${new Date(payment.due_date).getFullYear()}`;

      const totalAmount = payment.amount + (payment.late_fee || 0);
      const paymentType = totalAmount >= payment.amount ? 'Full' : 'Part';

      generateReceipt({
        receiptNumber: payment.receipt_number,
        date: receiptDate,
        buildingNumber: buildingNumber,
        floor: floor,
        flatNumber: payment.flat_number,
        residentName: payment.resident_name,
        amount: totalAmount,
        paymentMethod: payment.payment_method || 'Cash',
        chequeNumber: payment.payment_method?.toLowerCase().includes('cheque') ? payment.receipt_number : undefined,
        billNumber: billNumber,
        billDate: billDate,
        paymentType: paymentType,
        remarks: `Recd Agnst Bill No. ${billNumber} Dt.${billDate}`,
        societyName: 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.',
        registrationNumber: 'TNA/(TNA)/HSG/(TC)/11999/2000',
        address: 'MANPADA, THANE (WEST)-400 610',
        phoneNumber: '022 35187410',
      });

      toast.success('Receipt downloaded successfully!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const handleGenerateInvoice = async (payment: MaintenancePayment, silent: boolean = false) => {
    try {
      // Use dynamic charges from state, or default charges if not set
      const chargesToUse = invoiceCharges.length > 0 && invoiceCharges.some(c => c.label.trim() !== '')
        ? invoiceCharges.filter(c => c.label.trim() !== '').map(c => ({
          label: c.label,
          amount: c.amount
        }))
        : [
          { label: 'REPAIR & MAINTAINANCE', amount: 460 },
          { label: 'SERVICE CHARGES', amount: 1865 },
          { label: 'SINKING FUND', amount: 75 },
          { label: 'TMC TAXES PROPERTY/WATER', amount: 650 },
          { label: 'FEDERATION CHARGES', amount: 800 },
        ];

      // Calculate total from charges
      const invoiceTotal = chargesToUse.reduce((sum, charge) => sum + charge.amount, 0);

      // Update payment amount in database to match invoice total
      if (payment.amount !== invoiceTotal) {
        const { error: updateError } = await supabase
          .from('maintenance_payments')
          .update({ amount: invoiceTotal })
          .eq('id', payment.id);

        if (updateError) {
          console.error('Error updating payment amount:', updateError);
          if (!silent) toast.error('Failed to update payment amount');
        } else {
          // Update local state
          setPayments(prev => prev.map(p =>
            p.id === payment.id ? { ...p, amount: invoiceTotal } : p
          ));
          if (!silent) toast.success(`Payment amount updated to ₹${invoiceTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
        }
      }

      const invoiceDate = new Date();
      const billDate = `${String(invoiceDate.getDate()).padStart(2, '0')}.${String(invoiceDate.getMonth() + 1).padStart(2, '0')}.${invoiceDate.getFullYear()}`;

      generateInvoice({
        billNumber: payment.receipt_number || `BILL-${payment.id.slice(0, 8).toUpperCase()}`,
        residentName: payment.resident_name,
        flatNumber: payment.flat_number,
        month: months[payment.month - 1],
        year: payment.year,
        date: billDate,
        area: '900 Sq. Ft.', // Adding area as shown in the image
        charges: chargesToUse,
        arrears: 0,
        interest: payment.late_fee || 0,
        creditBalance: 0,
        societyName: 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.',
        registrationNumber: 'TNA/(TNA)/HSG/(TC)/11999/2000',
        address: 'MANPADA, THANE (WEST)-400 610',
        phoneNumber: '022 35187410',
      });

      if (!silent) toast.success('Invoice generated successfully!');
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      if (!silent) toast.error('Failed to generate invoice');
    }
  };

  const handleToggleInvoiceSelection = (paymentId: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredPayments.map(p => p.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleBulkDownloadInvoices = async () => {
    if (selectedInvoices.size === 0) {
      toast.error('Please select at least one invoice');
      return;
    }

    setIsBulkDownloading(true);
    const selectedPayments = filteredPayments.filter(p => selectedInvoices.has(p.id));
    const totalInvoices = selectedPayments.length;

    try {
      for (let i = 0; i < selectedPayments.length; i++) {
        const payment = selectedPayments[i];
        await handleGenerateInvoice(payment, true);

        // Add a small delay between downloads to avoid browser blocking
        if (i < selectedPayments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.success(`Successfully downloaded ${totalInvoices} invoice(s)!`);
      setSelectedInvoices(new Set());
    } catch (error: any) {
      console.error('Error downloading invoices:', error);
      toast.error('Failed to download some invoices');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const downloadAllReceipts = () => {
    const paidPayments = payments.filter(p => p.status === 'paid' && p.receipt_number && p.paid_date);

    if (paidPayments.length === 0) {
      toast.error('No paid payments with receipt numbers found.');
      return;
    }

    try {
      const receipts = paidPayments.map(payment => {
        const flatParts = payment.flat_number.split('/');
        const buildingNumber = flatParts.length > 0 ? flatParts[0].charAt(0) : undefined;
        const floor = flatParts.length > 1 ? flatParts[0].slice(1) : undefined;

        const paidDate = new Date(payment.paid_date!);
        const receiptDate = `${String(paidDate.getDate()).padStart(2, '0')}.${String(paidDate.getMonth() + 1).padStart(2, '0')}.${paidDate.getFullYear()}`;

        const billNumber = payment.receipt_number || `BILL-${payment.id.slice(0, 8).toUpperCase()}`;
        const billDate = `${String(new Date(payment.due_date).getDate()).padStart(2, '0')}.${String(new Date(payment.due_date).getMonth() + 1).padStart(2, '0')}.${new Date(payment.due_date).getFullYear()}`;

        const totalAmount = payment.amount + (payment.late_fee || 0);
        const paymentType: 'Full' | 'Part' = totalAmount >= payment.amount ? 'Full' : 'Part';

        return {
          receiptNumber: payment.receipt_number!,
          date: receiptDate,
          buildingNumber: buildingNumber,
          floor: floor,
          flatNumber: payment.flat_number,
          residentName: payment.resident_name,
          amount: totalAmount,
          paymentMethod: payment.payment_method || 'Cash',
          chequeNumber: payment.payment_method?.toLowerCase().includes('cheque') ? payment.receipt_number : undefined,
          billNumber: billNumber,
          billDate: billDate,
          paymentType: paymentType,
          remarks: `Recd Agnst Bill No. ${billNumber} Dt.${billDate}`,
          societyName: 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.',
          registrationNumber: 'TNA/(TNA)/HSG/(TC)/11999/2000',
          address: 'MANPADA, THANE (WEST)-400 610',
          phoneNumber: '022 35187410',
        };
      });

      generateAllReceipts(receipts);
      toast.success(`Downloaded ${receipts.length} receipts in one PDF!`);
    } catch (error: any) {
      console.error('Error generating all receipts:', error);
      toast.error('Failed to generate receipts');
    }
  };

  const downloadAllInvoices = async () => {
    if (payments.length === 0) {
      toast.error('No payments found to generate invoices.');
      return;
    }

    setIsBulkDownloading(true);

    try {
      // Use dynamic charges from state, or default charges if not set
      const chargesToUse = invoiceCharges.length > 0 && invoiceCharges.some(c => c.label.trim() !== '')
        ? invoiceCharges.filter(c => c.label.trim() !== '').map(c => ({
          label: c.label,
          amount: c.amount
        }))
        : [
          { label: 'REPAIR & MAINTAINANCE', amount: 460 },
          { label: 'SERVICE CHARGES', amount: 1865 },
          { label: 'SINKING FUND', amount: 75 },
          { label: 'TMC TAXES PROPERTY/WATER', amount: 650 },
          { label: 'FEDERATION CHARGES', amount: 800 },
        ];

      const invoiceDate = new Date();
      const billDate = `${String(invoiceDate.getDate()).padStart(2, '0')}.${String(invoiceDate.getMonth() + 1).padStart(2, '0')}.${invoiceDate.getFullYear()}`;

      // Prepare all invoice data
      const allInvoices = payments.map(payment => ({
        billNumber: payment.receipt_number || `BILL-${payment.id.slice(0, 8).toUpperCase()}`,
        residentName: payment.resident_name,
        flatNumber: payment.flat_number,
        month: months[payment.month - 1],
        year: payment.year,
        date: billDate,
        area: '900 Sq. Ft.',
        charges: chargesToUse,
        arrears: 0,
        interest: payment.late_fee || 0,
        creditBalance: 0,
        societyName: 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.',
        registrationNumber: 'TNA/(TNA)/HSG/(TC)/11999/2000',
        address: 'MANPADA, THANE (WEST)-400 610',
        phoneNumber: '022 35187410',
      }));

      // Generate all invoices in one PDF
      generateAllInvoices(allInvoices);
      toast.success(`Successfully downloaded ${allInvoices.length} invoice(s) in one PDF!`);
    } catch (error: any) {
      console.error('Error downloading all invoices:', error);
      toast.error('Failed to download invoices');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const exportToCSV = () => {
    try {
      // CSV Headers
      const headers = [
        'Receipt Number',
        'Date',
        'Flat Number',
        'Resident Name',
        'Month',
        'Year',
        'Amount',
        'Late Fee',
        'Total Amount',
        'Payment Method',
        'Payment Date',
        'Status',
        'Due Date'
      ];

      // CSV Rows
      const rows = payments.map(payment => [
        payment.receipt_number || 'N/A',
        payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'N/A',
        payment.flat_number,
        payment.resident_name,
        months[payment.month - 1],
        payment.year.toString(),
        payment.amount.toFixed(2),
        (payment.late_fee || 0).toFixed(2),
        (payment.amount + (payment.late_fee || 0)).toFixed(2),
        payment.payment_method || 'N/A',
        payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'N/A',
        payment.status,
        new Date(payment.due_date).toLocaleDateString()
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Maintenance_Payments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV file downloaded successfully!');
    } catch (error: any) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const generateReceiptNumber = (): string => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const random4Digits = String(Math.floor(1000 + Math.random() * 9000));
    return `${dd}${mm}${yy}${random4Digits}`;
  };

  const handleOpenPaymentDialog = (payment: MaintenancePayment) => {
    setSelectedPaymentForPayment(payment);
    const totalAmount = payment.amount + (payment.late_fee || 0);
    setAmountPaid(totalAmount.toString());
    setPaymentMethod('');
    setReceiptNumber(generateReceiptNumber());
    setPaymentNotes('');
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPaymentForPayment) return;

    const paidAmount = parseFloat(amountPaid);
    const totalDue = selectedPaymentForPayment.amount + (selectedPaymentForPayment.late_fee || 0);

    if (isNaN(paidAmount) || paidAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paidAmount > totalDue) {
      toast.error('Amount paid cannot exceed total due amount');
      return;
    }

    if (!paymentMethod.trim()) {
      toast.error('Please enter payment method');
      return;
    }

    setIsPaying(true);
    try {
      // Use auto-generated receipt number
      const receiptNum = receiptNumber.trim() || generateReceiptNumber();

      // Update payment status
      const updateData: any = {
        status: paidAmount >= totalDue ? 'paid' : 'partial',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod.trim(),
        receipt_number: receiptNum,
      };

      if (paymentNotes.trim()) {
        updateData.notes = paymentNotes.trim();
      }

      const { error: updateError } = await supabase
        .from('maintenance_payments')
        .update(updateData)
        .eq('id', selectedPaymentForPayment.id);

      if (updateError) throw updateError;

      toast.success(`Payment of ₹${paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} recorded successfully`);
      setShowPaymentDialog(false);
      setSelectedPaymentForPayment(null);
      setAmountPaid('');
      setPaymentMethod('');
      setReceiptNumber('');
      setPaymentNotes('');
      fetchPayments();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  // Get unique years from payments
  const years = Array.from(new Set(payments.map(p => p.year.toString()))).sort((a, b) => parseInt(b) - parseInt(a));

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
                Maintenance Payments
              </h1>
            </div>

            {/* Right Side - Buttons */}
            {isAdminOrReceptionist() && (
              <div className="ml-6 flex gap-3 animate-slide-in-right">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(true)}
                  className="border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-5 py-6 h-auto"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Generate Payments</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadAllInvoices}
                  disabled={isBulkDownloading}
                  className="border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-5 py-6 h-auto"
                >
                  {isBulkDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span className="font-semibold">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Download All Invoices</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadAllReceipts}
                  className="border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-5 py-6 h-auto"
                >
                  <Download className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Download All Receipts</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  className="border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-5 py-6 h-auto"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Export CSV</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Total Collection',
              value: totalAmount,
              subtitle: 'All time',
              icon: CreditCard,
              gradient: 'from-[#8c52ff] to-purple-600',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              iconBg: 'bg-[#8c52ff]/10',
              iconColor: 'text-[#8c52ff]',
            },
            {
              title: 'Collected',
              value: paidAmount,
              subtitle: `${collectionRate.toFixed(1)}% collection rate`,
              icon: CheckCircle,
              gradient: 'from-green-500 to-emerald-600',
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
              iconBg: 'bg-green-500/10',
              iconColor: 'text-green-600 dark:text-green-400',
            },
            {
              title: 'Pending',
              value: unpaidAmount,
              subtitle: 'Awaiting payment',
              icon: Clock,
              gradient: 'from-yellow-500 to-amber-600',
              bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
              iconBg: 'bg-yellow-500/10',
              iconColor: 'text-yellow-600 dark:text-yellow-400',
            },
            {
              title: 'Overdue',
              value: overdueAmount,
              subtitle: 'Requires action',
              icon: AlertTriangle,
              gradient: 'from-red-500 to-rose-600',
              bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
              iconBg: 'bg-red-500/10',
              iconColor: 'text-red-600 dark:text-red-400',
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
                      ₹<CountUpNumber value={Math.round(card.value)} />
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
                  placeholder="Search by flat number or resident name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-[150px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full sm:w-[150px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full sm:w-[120px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                      <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                    </div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading payments...</span>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No payments found</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        {searchTerm || filterStatus !== 'all' || filterMonth !== 'all' || filterYear !== 'all'
                          ? 'Try adjusting your filters.'
                          : 'Generate maintenance payments for flats to get started.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bulk Actions */}
                    <div className="px-6 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedInvoices.size === filteredPayments.length && filteredPayments.length > 0}
                            onCheckedChange={handleSelectAll}
                            disabled={isBulkDownloading}
                          />
                          <Label className="text-sm font-medium">
                            Select All ({selectedInvoices.size} selected)
                          </Label>
                        </div>
                      </div>
                      {selectedInvoices.size > 0 && (
                        <Button
                          onClick={handleBulkDownloadInvoices}
                          disabled={isBulkDownloading}
                          className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white"
                        >
                          {isBulkDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading {selectedInvoices.size} invoice(s)...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Selected ({selectedInvoices.size})
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                            <TableHead className="w-12 font-semibold text-gray-900 dark:text-gray-100 py-4"></TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Flat Number</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Resident Name</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Period</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Due Date</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Payment Date</TableHead>
                            <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayments.map((payment, idx) => {
                            return (
                              <TableRow
                                key={payment.id}
                                className={cn(
                                  "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                                  "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                                  idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                                )}
                              >
                                <TableCell className="py-4">
                                  <Checkbox
                                    checked={selectedInvoices.has(payment.id)}
                                    onCheckedChange={() => handleToggleInvoiceSelection(payment.id)}
                                    disabled={isBulkDownloading}
                                  />
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge
                                    variant="outline"
                                    className="border-[#8c52ff]/30 text-[#8c52ff] bg-[#8c52ff]/5 font-medium px-3 py-1"
                                  >
                                    {payment.flat_number}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 font-semibold text-gray-900 dark:text-gray-100">
                                  {payment.resident_name}
                                </TableCell>
                                <TableCell className="py-4 text-gray-700 dark:text-gray-300">
                                  {months[payment.month - 1]} {payment.year}
                                </TableCell>
                                <TableCell className="py-4">
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                      ₹<CountUpNumber value={Math.round(payment.amount)} />
                                    </div>
                                    {payment.late_fee > 0 && (
                                      <div className="text-xs text-red-600 font-medium">
                                        Late Fee: ₹<CountUpNumber value={Math.round(payment.late_fee)} />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 text-gray-600 dark:text-gray-400 font-medium">
                                  {new Date(payment.due_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </TableCell>
                                <TableCell className="py-4">
                                  <StatusBadge status={payment.status} />
                                </TableCell>
                                <TableCell className="py-4 text-gray-600 dark:text-gray-400 font-medium">
                                  {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : '-'}
                                </TableCell>
                                <TableCell className="text-right py-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleGenerateInvoice(payment)}
                                      title="Generate Invoice"
                                      disabled={isBulkDownloading}
                                      className="h-9 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                                    >
                                      <Receipt className="h-4 w-4 mr-2" />
                                      Invoice
                                    </Button>
                                    {isAdminOrReceptionist() && (payment.status === 'unpaid' || payment.status === 'overdue' || payment.status === 'partial') && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleOpenPaymentDialog(payment)}
                                        disabled={isPaying}
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold h-9"
                                        title="Mark as Paid"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Paid
                                      </Button>
                                    )}
                                    {payment.status === 'paid' && payment.receipt_number && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadReceipt(payment)}
                                        className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setSelectedPayment(payment)}
                                          className="h-9 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                          <DialogTitle>Payment Details</DialogTitle>
                                        </DialogHeader>
                                        {selectedPayment && (
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Flat Number</Label>
                                                <div className="font-medium">{selectedPayment.flat_number}</div>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Resident</Label>
                                                <div className="font-medium">{selectedPayment.resident_name}</div>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Period</Label>
                                                <div className="font-medium">{months[selectedPayment.month - 1]} {selectedPayment.year}</div>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                                <StatusBadge status={selectedPayment.status} />
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                                                <div className="font-medium">₹{selectedPayment.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                              </div>
                                              {selectedPayment.late_fee > 0 && (
                                                <div>
                                                  <Label className="text-sm font-medium text-muted-foreground">Late Fee</Label>
                                                  <div className="font-medium text-red-600">₹{selectedPayment.late_fee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                                </div>
                                              )}
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                                                <div className="font-medium">{new Date(selectedPayment.due_date).toLocaleDateString()}</div>
                                              </div>
                                              {selectedPayment.paid_date && (
                                                <div>
                                                  <Label className="text-sm font-medium text-muted-foreground">Paid Date</Label>
                                                  <div className="font-medium">{new Date(selectedPayment.paid_date).toLocaleDateString()}</div>
                                                </div>
                                              )}
                                              {selectedPayment.payment_method && (
                                                <div>
                                                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                                                  <div className="font-medium">{selectedPayment.payment_method}</div>
                                                </div>
                                              )}
                                              {selectedPayment.receipt_number && (
                                                <div>
                                                  <Label className="text-sm font-medium text-muted-foreground">Receipt Number</Label>
                                                  <div className="font-medium">{selectedPayment.receipt_number}</div>
                                                </div>
                                              )}
                                            </div>
                                            {selectedPayment.notes && (
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                                                <div className="font-medium">{selectedPayment.notes}</div>
                                              </div>
                                            )}
                                            {selectedPayment.status === 'paid' && selectedPayment.receipt_number && (
                                              <div className="flex justify-end">
                                                <Button onClick={() => downloadReceipt(selectedPayment)}>
                                                  <Download className="mr-2 h-4 w-4" />
                                                  Download Receipt
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredPayments.filter(p => p.status === 'paid').length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No paid payments found</h3>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flat Number</TableHead>
                        <TableHead>Resident Name</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.filter(p => p.status === 'paid').map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.flat_number}</TableCell>
                          <TableCell>{payment.resident_name}</TableCell>
                          <TableCell>{months[payment.month - 1]} {payment.year}</TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ₹<CountUpNumber value={Math.round(payment.amount + (payment.late_fee || 0))} />
                            </div>
                            {payment.late_fee > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Base: ₹<CountUpNumber value={Math.round(payment.amount)} /> + Late Fee: ₹<CountUpNumber value={Math.round(payment.late_fee)} />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.receipt_number || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateInvoice(payment)}
                                title="Generate Invoice"
                              >
                                <Receipt className="h-4 w-4 mr-2" />
                                Invoice
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadReceipt(payment)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unpaid" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredPayments.filter(p => p.status === 'unpaid').length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No unpaid payments found</h3>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flat Number</TableHead>
                        <TableHead>Resident Name</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Pending</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.filter(p => p.status === 'unpaid').map((payment) => {
                        const daysPending = Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.flat_number}</TableCell>
                            <TableCell>{payment.resident_name}</TableCell>
                            <TableCell>{months[payment.month - 1]} {payment.year}</TableCell>
                            <TableCell className="font-medium">
                              ₹<CountUpNumber value={Math.round(payment.amount)} />
                            </TableCell>
                            <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={daysPending > 0 ? 'destructive' : 'secondary'}>
                                {daysPending > 0 ? `${daysPending} days overdue` : 'Due soon'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm">
                                Send Reminder
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredPayments.filter(p => p.status === 'overdue').length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No overdue payments found</h3>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flat Number</TableHead>
                        <TableHead>Resident Name</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Late Fee</TableHead>
                        <TableHead>Total Due</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.filter(p => p.status === 'overdue').map((payment) => {
                        const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24));
                        const totalDue = payment.amount + (payment.late_fee || 0);
                        return (
                          <TableRow key={payment.id} className="border-red-200">
                            <TableCell className="font-medium">{payment.flat_number}</TableCell>
                            <TableCell>{payment.resident_name}</TableCell>
                            <TableCell>{months[payment.month - 1]} {payment.year}</TableCell>
                            <TableCell>
                              ₹<CountUpNumber value={Math.round(payment.amount)} />
                            </TableCell>
                            <TableCell className="text-red-600">
                              ₹<CountUpNumber value={Math.round(payment.late_fee || 0)} />
                            </TableCell>
                            <TableCell className="font-medium text-red-600">
                              ₹<CountUpNumber value={Math.round(totalDue)} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {daysOverdue} days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateInvoice(payment)}
                                  title="Generate Invoice"
                                >
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Invoice
                                </Button>
                                <Button size="sm" variant="destructive">
                                  Send Notice
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : payments.filter(p => p.status === 'paid').length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No payment history</h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments
                      .filter(p => p.status === 'paid')
                      .sort((a, b) => new Date(b.paid_date || '').getTime() - new Date(a.paid_date || '').getTime())
                      .map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="p-2 rounded-full bg-green-100">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {payment.flat_number} - {payment.resident_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {months[payment.month - 1]} {payment.year} • ₹{(payment.amount + (payment.late_fee || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : ''}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {payment.payment_method || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateInvoice(payment)}
                              title="Generate Invoice"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Invoice
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReceipt(payment)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Payments Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Generate Maintenance Payments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select value={generatingMonth.toString()} onValueChange={(value) => setGeneratingMonth(parseInt(value))}>
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={generatingYear}
                  onChange={(e) => setGeneratingYear(parseInt(e.target.value) || new Date().getFullYear())}
                  min="2020"
                  max="2100"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Select month and year, then preview and configure invoice charges before generating payments.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)} disabled={isGenerating}>
                Cancel
              </Button>
              <Button onClick={handlePreviewInvoice} disabled={isGenerating}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Invoice Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Invoice - {months[generatingMonth - 1]} {generatingYear}</DialogTitle>
              <DialogDescription>
                Configure invoice charges before generating payments. You can edit amounts, add new fields, or change the total.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Invoice Charges</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChargeField}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-3 border rounded-lg p-4">
                  {invoiceCharges.map((charge, index) => (
                    <div key={charge.id} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Charge Name</Label>
                          <Input
                            value={charge.label}
                            onChange={(e) => handleUpdateCharge(charge.id, 'label', e.target.value)}
                            placeholder="Enter charge name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Amount (₹)</Label>
                          <Input
                            type="number"
                            value={charge.amount}
                            onChange={(e) => handleUpdateCharge(charge.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      {invoiceCharges.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveChargeField(charge.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Total Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={calculateTotal()}
                      onChange={(e) => handleUpdateTotal(parseFloat(e.target.value) || 0)}
                      className="w-32 text-right font-semibold"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-sm text-muted-foreground">₹</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {customTotal !== null
                    ? 'Total has been manually adjusted. Service charges will be adjusted to match.'
                    : `Calculated total: ₹${invoiceCharges.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowPreviewDialog(false);
                setShowGenerateDialog(true);
              }}>
                Back
              </Button>
              <Button onClick={generatePaymentsForMonth} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Payments
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {selectedPaymentForPayment && (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Flat Number</Label>
                    <div className="text-sm font-medium">{selectedPaymentForPayment.flat_number}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Resident Name</Label>
                    <div className="text-sm font-medium">{selectedPaymentForPayment.resident_name}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Period</Label>
                    <div className="text-sm">{months[selectedPaymentForPayment.month - 1]} {selectedPaymentForPayment.year}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Total Due</Label>
                    <div className="text-sm font-bold text-orange-600">
                      ₹{(selectedPaymentForPayment.amount + (selectedPaymentForPayment.late_fee || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
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
                    max={selectedPaymentForPayment.amount + (selectedPaymentForPayment.late_fee || 0)}
                    step="0.01"
                    disabled={isPaying}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isPaying}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    type="text"
                    value={receiptNumber}
                    readOnly
                    disabled={isPaying}
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                  <Textarea
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    disabled={isPaying}
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setSelectedPaymentForPayment(null);
                  setAmountPaid('');
                  setPaymentMethod('');
                  setReceiptNumber('');
                  setPaymentNotes('');
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
