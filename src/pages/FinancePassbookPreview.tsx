import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, FileText, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

export default function FinancePassbookPreview() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [debits, setDebits] = useState(0);
  const [balance, setBalance] = useState(0);
  const [maintenanceTotal, setMaintenanceTotal] = useState(0);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [depositTotal, setDepositTotal] = useState(0);
  const [roomTotal, setRoomTotal] = useState(0);
  const summaryCardsRef = useRef<HTMLDivElement>(null);

  // Format number without thousands separators, with exactly 2 decimal places
  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  useEffect(() => {
    fetchAllFinanceData();
  }, []);

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
        return dateB - dateA;
      });

      setTransactions(allTransactions);

      // Calculate totals
      const creditsTotal = allTransactions
        .filter(t => ['maintenance', 'deposit', 'society_room'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);

      const debitsTotal = allTransactions
        .filter(t => t.type === 'vendor')
        .reduce((sum, t) => sum + t.amount, 0);

      const balanceTotal = creditsTotal - debitsTotal;

      const maintenance = allTransactions
        .filter(t => t.type === 'maintenance')
        .reduce((sum, t) => sum + t.amount, 0);

      const vendor = allTransactions
        .filter(t => t.type === 'vendor')
        .reduce((sum, t) => sum + t.amount, 0);

      const deposit = allTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);

      const room = allTransactions
        .filter(t => t.type === 'society_room')
        .reduce((sum, t) => sum + t.amount, 0);

      setCredits(creditsTotal);
      setDebits(debitsTotal);
      setBalance(balanceTotal);
      setMaintenanceTotal(maintenance);
      setVendorTotal(vendor);
      setDepositTotal(deposit);
      setRoomTotal(room);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setIsLoading(false);
    }
  };

  const creditTransactions = transactions.filter(t =>
    ['maintenance', 'deposit', 'society_room'].includes(t.type)
  );

  const debitTransactions = transactions.filter(t =>
    t.type === 'vendor'
  );

  // Calculate running balance for passbook format (oldest first)
  const passbookTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB; // Oldest first for passbook
  });

  const passbookData = passbookTransactions.map((transaction, index) => {
    const isCredit = ['maintenance', 'deposit', 'society_room'].includes(transaction.type);
    const previousBalance = index === 0 ? 0 : 
      passbookTransactions.slice(0, index).reduce((balance, t) => {
        const isPrevCredit = ['maintenance', 'deposit', 'society_room'].includes(t.type);
        return isPrevCredit ? balance + t.amount : balance - t.amount;
      }, 0);
    const currentBalance = isCredit 
      ? previousBalance + transaction.amount 
      : previousBalance - transaction.amount;
    
    return {
      ...transaction,
      isCredit,
      debit: isCredit ? 0 : transaction.amount,
      credit: isCredit ? transaction.amount : 0,
      balance: currentBalance,
    };
  });

  const downloadPassbook = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const contentMargin = margin / 2; // Same margin as screenshot (10mm)

      // Society Header
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      const headerText = 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.';
      const headerWidth = doc.getTextWidth(headerText);
      const headerX = (pageWidth - headerWidth) / 2; // Center the text
      doc.text(headerText, headerX, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const regText = 'Registration No.: TNA/(TNA)/HSG/(TC)/11999/2000';
      const regWidth = doc.getTextWidth(regText);
      const regX = (pageWidth - regWidth) / 2;
      doc.text(regText, regX, yPosition);
      yPosition += 6;

      const addressText = 'MANPADA, THANE (WEST)-400 610';
      const addressWidth = doc.getTextWidth(addressText);
      const addressX = (pageWidth - addressWidth) / 2;
      doc.text(addressText, addressX, yPosition);
      yPosition += 6;

      const telText = 'Tel No.: 022 35187410';
      const telWidth = doc.getTextWidth(telText);
      const telX = (pageWidth - telWidth) / 2;
      doc.text(telText, telX, yPosition);
      yPosition += 8;

      // Draw horizontal line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(contentMargin, yPosition, pageWidth - contentMargin, yPosition);
      yPosition += 10;

      // Capture summary cards section as image (increased size)
      if (summaryCardsRef.current) {
        try {
          const canvas = await html2canvas(summaryCardsRef.current, {
            backgroundColor: '#ffffff',
            scale: 3,
            logging: false,
            useCORS: true,
            windowWidth: summaryCardsRef.current.scrollWidth,
            windowHeight: summaryCardsRef.current.scrollHeight,
          });
          
          const imgData = canvas.toDataURL('image/png');
          // Use consistent margin for the image
          const imgWidth = pageWidth - (contentMargin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if image fits on current page, otherwise add new page
          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.addImage(imgData, 'PNG', contentMargin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.error('Error capturing summary cards:', error);
          // Continue without the image if capture fails
        }
      }

      // Passbook Table (Excel Format)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(140, 82, 255);
      doc.text('Passbook', contentMargin, yPosition);
      yPosition += 8;

      // Prepare passbook data for PDF (sorted oldest first)
      const sortedForPDF = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Oldest first for passbook
      });

      const passbookPDFData = sortedForPDF.map((transaction, index) => {
        const isCredit = ['maintenance', 'deposit', 'society_room'].includes(transaction.type);
        const previousBalance = index === 0 ? 0 : 
          sortedForPDF.slice(0, index).reduce((balance, t) => {
            const isPrevCredit = ['maintenance', 'deposit', 'society_room'].includes(t.type);
            return isPrevCredit ? balance + t.amount : balance - t.amount;
          }, 0);
        const currentBalance = isCredit 
          ? previousBalance + transaction.amount 
          : previousBalance - transaction.amount;
        
        // Format date as "DD MMM YYYY" (e.g., "04 Dec 2025")
        const dateObj = new Date(transaction.date);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        const date = `${day} ${month} ${year}`;
        
        // Format numbers without thousands separators, with exactly 2 decimal places
        const formatAmount = (amount: number) => {
          return amount.toFixed(2);
        };
        
        return [
          (index + 1).toString(), // Serial number
          date,
          transaction.description.length > 45 ? transaction.description.substring(0, 42) + '...' : transaction.description,
          isCredit ? '' : formatAmount(transaction.amount),
          isCredit ? formatAmount(transaction.amount) : '',
          formatAmount(currentBalance)
        ];
      });

      // Add totals row
      const formatAmount = (amount: number) => {
        return amount.toFixed(2);
      };

      passbookPDFData.push([
        '',
        '',
        'TOTAL',
        formatAmount(debits),
        formatAmount(credits),
        formatAmount(balance)
      ]);

      // Calculate available width with consistent margins
      const availableWidth = pageWidth - (contentMargin * 2);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Sr', 'Date', 'Description', 'Debit', 'Credit', 'Balance']],
        body: passbookPDFData,
        theme: 'grid',
        headStyles: { 
          fillColor: [140, 82, 255], 
          textColor: 255, 
          fontStyle: 'bold', 
          fontSize: 10,
          lineWidth: 0.5,
          lineColor: [255, 255, 255],
          cellPadding: 3
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 2.5, 
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 15, fontStyle: 'normal', halign: 'center' },
          1: { cellWidth: 28, fontStyle: 'normal', halign: 'left' },
          2: { cellWidth: 65, fontStyle: 'normal', halign: 'left' },
          3: { cellWidth: 25, halign: 'right', fontStyle: 'normal', textColor: [239, 68, 68] },
          4: { cellWidth: 25, halign: 'right', fontStyle: 'normal', textColor: [16, 185, 129] },
          5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: contentMargin, right: contentMargin },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        didParseCell: (data: any) => {
          // Style totals row
          if (data.row.index === passbookPDFData.length - 1) {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 9.5;
            if (data.column.index === 3 && data.cell.text[0] && data.cell.text[0] !== 'TOTAL' && data.cell.text[0] !== '') {
              data.cell.styles.textColor = [239, 68, 68];
            } else if (data.column.index === 4 && data.cell.text[0] && data.cell.text[0] !== 'TOTAL' && data.cell.text[0] !== '') {
              data.cell.styles.textColor = [16, 185, 129];
            } else if (data.column.index === 5 && data.cell.text[0] && data.cell.text[0] !== 'TOTAL' && data.cell.text[0] !== '') {
              data.cell.styles.textColor = balance >= 0 ? [16, 185, 129] : [239, 68, 68];
            }
          }
          // Style balance column for regular rows
          if (data.column.index === 5 && data.row.index < passbookPDFData.length - 1) {
            const balanceText = data.cell.text[0].replace(/[,]/g, '');
            const balanceValue = parseFloat(balanceText);
            if (!isNaN(balanceValue)) {
              data.cell.styles.textColor = balanceValue >= 0 ? [16, 185, 129] : [239, 68, 68];
            }
          }
          // Style debit column for regular rows
          if (data.column.index === 3 && data.row.index < passbookPDFData.length - 1 && data.cell.text[0] && data.cell.text[0] !== '') {
            data.cell.styles.textColor = [239, 68, 68];
          }
          // Style credit column for regular rows
          if (data.column.index === 4 && data.row.index < passbookPDFData.length - 1 && data.cell.text[0] && data.cell.text[0] !== '') {
            data.cell.styles.textColor = [16, 185, 129];
          }
        },
      });
      yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 20;

      // Final Balance
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Final Balance:', contentMargin, yPosition);
      
      // Calculate text width for the balance to size the box
      const balanceText = balance.toFixed(2);
      doc.setFontSize(18);
      if (balance >= 0) {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      
      // Calculate box dimensions
      const textWidth = doc.getTextWidth(balanceText);
      const boxPadding = 8;
      const boxX = contentMargin;
      const boxY = yPosition + 3;
      const boxWidth = textWidth + (boxPadding * 2);
      const boxHeight = 12;
      
      // Draw box with rounded corners (using rect for compatibility)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(boxX, boxY, boxWidth, boxHeight);
      
      // Draw text inside box
      doc.text(balanceText, contentMargin + boxPadding, yPosition + 10);

      // Footer on each page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generate filename with current date
      const fileName = `Finance_Passbook_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Passbook downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate passbook');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8c52ff] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading passbook data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/finance')}
                className="border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Finance Passbook Preview
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mt-1">
                  Review your financial statement before downloading
                </p>
              </div>
            </div>
            <Button
              onClick={downloadPassbook}
              className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#7a45e6] hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Passbook Content */}
        <div className="space-y-6">
          {/* Summary Cards and Category Breakdown - Captured for PDF */}
          <div ref={summaryCardsRef}>
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credits</CardTitle>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">₹{credits.toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Debits</CardTitle>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₹{debits.toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</CardTitle>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    balance >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    ₹{balance.toLocaleString('en-IN')}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</CardTitle>
                  <FileText className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{transactions.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                  <p className="text-xl font-bold text-blue-600">₹{maintenanceTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vendors</p>
                  <p className="text-xl font-bold text-red-600">₹{vendorTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Deposits</p>
                  <p className="text-xl font-bold text-green-600">₹{depositTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Room Rent</p>
                  <p className="text-xl font-bold text-purple-600">₹{roomTotal.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Passbook Table - Excel Format */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#8c52ff]/10">
                    <FileText className="h-6 w-6 text-[#8c52ff]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Finance Passbook</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete transaction history with running balance</p>
                  </div>
                </div>
                <Badge className="px-4 py-1.5 text-sm font-bold bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400">
                  {transactions.length} transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#8c52ff]/10 to-purple-600/10 dark:from-[#8c52ff]/20 dark:to-purple-600/20 border-b-2 border-[#8c52ff]">
                      <TableHead className="font-bold text-sm border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 sticky left-0 z-10 min-w-[60px] shadow-sm text-center">Sr</TableHead>
                      <TableHead className="font-bold text-sm border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 sticky left-[60px] z-10 min-w-[120px] shadow-sm">Date</TableHead>
                      <TableHead className="font-bold text-sm border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-[300px]">Description</TableHead>
                      <TableHead className="font-bold text-sm text-right border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-[130px]">Debit</TableHead>
                      <TableHead className="font-bold text-sm text-right border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-[130px]">Credit</TableHead>
                      <TableHead className="font-bold text-sm text-right bg-white dark:bg-gray-900 min-w-[130px]">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passbookData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {passbookData.map((row, idx) => (
                          <TableRow
                            key={row.id}
                            className={cn(
                              "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                              idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/30"
                            )}
                          >
                            <TableCell className="font-medium border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky left-0 z-10 shadow-sm text-center">
                              <span className="text-sm whitespace-nowrap">{idx + 1}</span>
                            </TableCell>
                            <TableCell className="font-medium border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky left-[60px] z-10 shadow-sm">
                              <span className="text-sm whitespace-nowrap">
                                {(() => {
                                  const dateObj = new Date(row.date);
                                  const day = dateObj.getDate().toString().padStart(2, '0');
                                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const month = monthNames[dateObj.getMonth()];
                                  const year = dateObj.getFullYear();
                                  return `${day} ${month} ${year}`;
                                })()}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium border-r border-gray-200 dark:border-gray-700">
                              <span className="text-sm">{row.description}</span>
                            </TableCell>
                            <TableCell className="text-right border-r border-gray-200 dark:border-gray-700">
                              {row.debit > 0 ? (
                                <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                                  {formatNumber(row.debit)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right border-r border-gray-200 dark:border-gray-700">
                              {row.credit > 0 ? (
                                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                                  {formatNumber(row.credit)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-sm font-bold whitespace-nowrap",
                                row.balance >= 0 ? "text-emerald-600" : "text-red-600"
                              )}>
                                {formatNumber(row.balance)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Summary Row */}
                        <TableRow className="bg-gradient-to-r from-[#8c52ff]/10 to-purple-600/10 dark:from-[#8c52ff]/20 dark:to-purple-600/20 border-t-2 border-[#8c52ff] font-bold">
                          <TableCell colSpan={3} className="border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 sticky left-0 z-10 shadow-sm">
                            <span className="text-sm font-bold">TOTAL</span>
                          </TableCell>
                          <TableCell className="text-right border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                              {formatNumber(debits)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                              {formatNumber(credits)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right bg-white dark:bg-gray-900">
                            <span className={cn(
                              "text-sm font-bold whitespace-nowrap",
                              balance >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {formatNumber(balance)}
                            </span>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Final Balance */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Final Balance:</p>
                  <div className="inline-block border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800">
                    <p className={cn(
                      "text-4xl font-bold whitespace-nowrap",
                      balance >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatNumber(balance)}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-[#8c52ff] to-purple-600">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

