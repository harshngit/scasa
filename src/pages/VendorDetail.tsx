import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, Phone, Mail, DollarSign, Loader2, FileText, Download, Receipt } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generateVendorInvoice } from '@/lib/vendor-invoice-generator';

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

interface InvoiceItem {
  id: string;
  srNo: number;
  description: string;
  charges: number;
}

interface VendorInvoice {
  id: string;
  vendor_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceItem[];
  total_amount: number;
  notes: string | null;
  created_at: string;
}

interface BillingHistory {
  id: string;
  vendor_id: string;
  amount_paid: number;
  payment_date: string;
  payment_timestamp: string;
  notes: string | null;
  created_at: string;
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<VendorInvoice[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVendor();
      fetchInvoiceHistory();
      fetchBillingHistory();
    }
  }, [id]);

  const fetchVendor = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVendor(data);
    } catch (error: any) {
      console.error('Error fetching vendor:', error);
      toast.error('Failed to fetch vendor details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoiceHistory = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoiceHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching invoice history:', error);
      toast.error('Failed to fetch invoice history');
    }
  };

  const fetchBillingHistory = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('vendor_id', id)
        .order('payment_date', { ascending: false })
        .order('payment_timestamp', { ascending: false });

      if (error) throw error;
      setBillingHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching billing history:', error);
      toast.error('Failed to fetch billing history');
    }
  };

  const handleDownloadInvoice = async (invoice: VendorInvoice) => {
    if (!vendor) return;

    setDownloadingInvoiceId(invoice.id);
    try {
      const invoiceData = {
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        vendor: {
          id: vendor.id,
          vendor_name: vendor.vendor_name,
          email: vendor.email,
          phone_number: vendor.phone_number,
          work_details: vendor.work_details
        },
        items: invoice.items,
        totalAmount: invoice.total_amount,
        notes: invoice.notes || undefined
      };

      generateVendorInvoice(invoiceData);
      toast.success('Invoice downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleToggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(invoiceHistory.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (!vendor || selectedInvoices.size === 0) {
      toast.error('Please select at least one invoice');
      return;
    }

    setIsBulkDownloading(true);
    const selectedInvoiceList = invoiceHistory.filter(inv => selectedInvoices.has(inv.id));
    const totalInvoices = selectedInvoiceList.length;

    try {
      for (let i = 0; i < selectedInvoiceList.length; i++) {
        const invoice = selectedInvoiceList[i];
        const invoiceData = {
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          dueDate: invoice.due_date,
          vendor: {
            id: vendor.id,
            vendor_name: vendor.vendor_name,
            email: vendor.email,
            phone_number: vendor.phone_number,
            work_details: vendor.work_details
          },
          items: invoice.items,
          totalAmount: invoice.total_amount,
          notes: invoice.notes || undefined
        };

        generateVendorInvoice(invoiceData);
        
        // Add a small delay between downloads to avoid browser blocking
        if (i < selectedInvoiceList.length - 1) {
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!vendor) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Vendor not found</p>
          <Button onClick={() => navigate('/vendors')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/vendors')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{vendor.vendor_name}</h1>
              <p className="text-muted-foreground">Vendor details and invoice history</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Vendor Name</Label>
                <div className="font-medium">{vendor.vendor_name}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>{vendor.email}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>{vendor.phone_number}</div>
                </div>
              </div>
              {vendor.work_details && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Work Details</Label>
                  <div className="text-sm">{vendor.work_details}</div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                <div className="text-sm">
                  {new Date(vendor.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Total Bill</Label>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{Number(vendor.total_bill).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Outstanding Bill</Label>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{Number(vendor.outstanding_bill).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Paid Bill</Label>
                <div className="text-2xl font-bold text-green-600">
                  ₹{Number(vendor.paid_bill).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice and Payment History Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="invoices" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Invoice History
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <Receipt className="h-4 w-4 mr-2" />
                  Paid History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoices" className="mt-4">
                {invoiceHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No invoices found. Create an invoice to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bulk Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedInvoices.size === invoiceHistory.length && invoiceHistory.length > 0}
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
                          onClick={handleBulkDownload}
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

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Invoice Number</TableHead>
                          <TableHead>Invoice Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceHistory.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInvoices.has(invoice.id)}
                                onCheckedChange={() => handleToggleInvoiceSelection(invoice.id)}
                                disabled={isBulkDownloading}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>
                              {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.due_date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ₹{Number(invoice.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {invoice.items?.length || 0} item(s)
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice)}
                                disabled={downloadingInvoiceId === invoice.id || isBulkDownloading}
                              >
                                {downloadingInvoiceId === invoice.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                {billingHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment history found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Payment Time</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.payment_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            {new Date(record.payment_timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ₹{Number(record.amount_paid).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                          </TableCell>
                          <TableCell>{record.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

