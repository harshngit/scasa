import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X, ArrowLeft, FileText, Eye, Loader2, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generateVendorInvoice } from '@/lib/vendor-invoice-generator';

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  if (num < 1000) {
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
  }
  if (num < 100000) {
    return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
  }
  if (num < 10000000) {
    return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
  }
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
};

interface Vendor {
  id: string;
  vendor_name: string;
  email: string;
  phone_number: string;
  work_details: string | null;
  total_bill: number;
  outstanding_bill: number;
  paid_bill: number;
}

interface InvoiceItem {
  id: string;
  srNo: number;
  description: string;
  charges: number;
}

export default function CreateVendorInvoice() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', srNo: 1, description: '', charges: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `INV-${timestamp}-${random}`;
    };
    setInvoiceNumber(generateInvoiceNumber());
  }, []);

  // Calculate due date (12 days after invoice date)
  useEffect(() => {
    if (invoiceDate) {
      const due = new Date(invoiceDate);
      due.setDate(due.getDate() + 12);
      setDueDate(due.toISOString().split('T')[0]);
    }
  }, [invoiceDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch vendors for autocomplete
  useEffect(() => {
    const fetchVendors = async () => {
      if (searchTerm.length < 1) {
        setVendors([]);
        return;
      }

      setIsLoadingVendors(true);
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .ilike('vendor_name', `%${searchTerm}%`)
          .limit(10);

        if (error) throw error;
        setVendors(data || []);
      } catch (error: any) {
        console.error('Error fetching vendors:', error);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchVendors();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSearchTerm(vendor.vendor_name);
    setShowVendorDropdown(false);
  };

  const handleAddItem = () => {
    const newSrNo = items.length + 1;
    setItems([...items, { id: Date.now().toString(), srNo: newSrNo, description: '', charges: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      const updatedItems = items.filter(item => item.id !== id);
      // Re-number items
      const renumberedItems = updatedItems.map((item, index) => ({
        ...item,
        srNo: index + 1
      }));
      setItems(renumberedItems);
    }
  };

  const handleItemChange = (id: string, field: 'description' | 'charges', value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: field === 'charges' ? parseFloat(value as string) || 0 : value };
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.charges || 0), 0);

  const handlePreview = () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }
    if (items.some(item => !item.description.trim())) {
      toast.error('Please fill in all descriptions');
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }
    if (items.some(item => !item.description.trim())) {
      toast.error('Please fill in all descriptions');
      return;
    }
    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than 0');
      return;
    }

    setIsGenerating(true);
    try {
      const invoiceItems = items.filter(item => item.description.trim() !== '');
      const invoiceData = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        vendor: selectedVendor,
        items: invoiceItems,
        totalAmount,
        notes
      };

      // Save invoice to database
      const { data: savedInvoice, error: saveError } = await supabase
        .from('vendor_invoices')
        .insert({
          vendor_id: selectedVendor.id,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          items: invoiceItems,
          amount: totalAmount, // Required field
          total_amount: totalAmount,
          outstanding_amount: totalAmount, // Initially all is outstanding
          paid_amount: 0, // Initially nothing is paid
          status: 'pending', // Must satisfy status check constraint
          notes: notes || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving invoice:', saveError);
        toast.error('Failed to save invoice to database');
        return;
      }

      // Generate PDF
      generateVendorInvoice(invoiceData);

      // Update vendor's outstanding bill
      const newOutstandingBill = (selectedVendor.outstanding_bill || 0) + totalAmount;
      const newTotalBill = (selectedVendor.total_bill || 0) + totalAmount;

      await supabase
        .from('vendors')
        .update({
          outstanding_bill: newOutstandingBill,
          total_bill: newTotalBill
        })
        .eq('id', selectedVendor.id);

      toast.success('Invoice generated and saved successfully!');
      setIsPreviewOpen(false);
      setTimeout(() => {
        navigate('/vendors');
      }, 1500);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-3xl font-bold tracking-tight">Create Vendor Invoice</h1>
              <p className="text-muted-foreground">
                Generate a new invoice for a vendor
              </p>
            </div>
          </div>
          <Button onClick={handlePreview} disabled={!selectedVendor || totalAmount <= 0} className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white">
            <Eye className="mr-2 h-4 w-4" />
            Preview Invoice
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorSearch">Vendor Name *</Label>
                  <div className="relative" ref={vendorDropdownRef}>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="vendorSearch"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowVendorDropdown(true);
                        if (!e.target.value) {
                          setSelectedVendor(null);
                        }
                      }}
                      onFocus={() => setShowVendorDropdown(true)}
                      placeholder="Search and select vendor..."
                      className="pl-10"
                    />
                    {showVendorDropdown && searchTerm && filteredVendors.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {isLoadingVendors ? (
                          <div className="p-4 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : (
                          filteredVendors.map((vendor) => (
                            <div
                              key={vendor.id}
                              onClick={() => handleVendorSelect(vendor)}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{vendor.vendor_name}</div>
                              <div className="text-sm text-muted-foreground">{vendor.email}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedVendor && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <Input value={selectedVendor.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                      <Input value={selectedVendor.phone_number} disabled />
                    </div>
                    {selectedVendor.work_details && (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Work Details</Label>
                        <Textarea value={selectedVendor.work_details} disabled rows={2} />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      disabled
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoice Items</CardTitle>
                  <Button type="button" variant="outline" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-sm border-b pb-2">
                    <div className="col-span-1">Sr.No</div>
                    <div className="col-span-7">Description</div>
                    <div className="col-span-3">Charges (₹)</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                      <Input
                          value={item.srNo}
                          disabled
                          className="bg-muted text-center"
                      />
                    </div>
                      <div className="col-span-7">
                      <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Enter description"
                      />
                    </div>
                      <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                          value={item.charges || ''}
                          onChange={(e) => handleItemChange(item.id, 'charges', e.target.value)}
                          placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                          type="button"
                        variant="outline"
                        size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                  <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes or terms..."
                  rows={4}
                  />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-medium">{items.filter(i => i.description.trim()).length}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">
                        ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full bg-[#8c52ff] hover:bg-[#7a45e6] text-white"
                  onClick={handlePreview}
                  disabled={!selectedVendor || totalAmount <= 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/vendors')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
              <DialogDescription>
                Review the invoice before generating. Click "Generate Invoice" to create the PDF.
              </DialogDescription>
            </DialogHeader>

            {selectedVendor && (
              <div className="space-y-4">
                <div className="border rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold mb-2">Bill To:</h3>
                      <p className="font-medium">{selectedVendor.vendor_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedVendor.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedVendor.phone_number}</p>
                      {selectedVendor.work_details && (
                        <p className="text-sm text-muted-foreground mt-2">{selectedVendor.work_details}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p><span className="font-medium">Invoice No:</span> {invoiceNumber}</p>
                      <p><span className="font-medium">Date:</span> {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                      <p><span className="font-medium">Due Date:</span> {new Date(dueDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="border-t border-b py-4">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold">Sr.No</th>
                          <th className="text-left py-2 font-semibold">Description</th>
                          <th className="text-right py-2 font-semibold">Amount (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.filter(i => i.description.trim()).map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.srNo}</td>
                            <td className="py-2">{item.description}</td>
                            <td className="text-right py-2">
                              Rs. {item.charges.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Amount Section */}
                  <div className="flex justify-end mt-6">
                    <div className="text-right">
                      <span className="font-semibold text-base">Total Amount</span>
                      <span className="ml-3 font-semibold text-base">
                        Rs. {totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Amount in Words Block */}
                  <div className="mt-6 border-2 border-black py-3 px-4 text-center bg-white">
                    <p className="text-sm font-normal">
                      Amount in Words: {numberToWords(Math.floor(totalAmount))} Rupees Only
                    </p>
                  </div>

                  {/* Notes Section */}
                  <div className="mt-6">
                    <p className="font-bold mb-2 text-sm">Notes:</p>
                    <p className="text-sm">{notes && notes.trim() ? notes : 'No additional Notes'}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateInvoice} disabled={isGenerating} className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Invoice
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
