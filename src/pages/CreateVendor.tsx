import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, Phone, Mail, FileText, DollarSign } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateVendor() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    email: '',
    phoneNumber: '',
    workDetails: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.vendorName.trim()) {
      toast.error('Please enter vendor name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating vendor...');

    try {
      const vendorData = {
        vendor_name: formData.vendorName.trim(),
        email: formData.email.trim(),
        phone_number: formData.phoneNumber.trim(),
        work_details: formData.workDetails.trim() || null,
        total_bill: 0,
        outstanding_bill: 0, // Will grow via invoices
        paid_bill: 0,
      };

      const { data, error } = await supabase
        .from('vendors')
        .insert([vendorData])
        .select()
        .single();

      toast.dismiss(loadingToast);

      if (error) {
        console.error('Error creating vendor:', error);
        toast.error(`Failed to create vendor: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      toast.success('Vendor created successfully!');

      // Navigate back to vendors page after successful creation
      setTimeout(() => {
        navigate('/vendors');
      }, 1000);
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to create vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/vendors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Vendor</h1>
            <p className="text-muted-foreground">
              Add a new vendor with complete details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Vendor Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
                    placeholder="Enter vendor name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workDetails">Work Details</Label>
                <Textarea
                  id="workDetails"
                  value={formData.workDetails}
                  onChange={(e) => handleInputChange('workDetails', e.target.value)}
                  placeholder="Enter work details, services provided, etc."
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/vendors')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Vendor'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
