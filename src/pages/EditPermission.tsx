import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileCheck, Loader2, User, Phone, Mail, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function EditPermission() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    residentName: '',
    phoneNumber: '',
    email: '',
    flatNumber: '',
    wing: '',
    permissionText: '',
    permissionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (id) {
      fetchPermission();
    }
  }, [id]);

  const fetchPermission = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          residentName: data.resident_name || '',
          phoneNumber: data.phone_number || '',
          email: data.email || '',
          flatNumber: data.flat_number || '',
          wing: data.wing || '',
          permissionText: data.permission_text || '',
          permissionDate: data.permission_date || new Date().toISOString().split('T')[0],
        });
      }
    } catch (error: any) {
      console.error('Error fetching permission:', error);
      toast.error('Failed to load permission data');
      navigate('/permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.residentName.trim()) {
      toast.error('Please enter resident name');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.flatNumber.trim()) {
      toast.error('Please enter flat number');
      return false;
    }
    if (!formData.permissionText.trim()) {
      toast.error('Please enter permission text');
      return false;
    }
    if (!formData.permissionDate) {
      toast.error('Please select permission date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Updating permission...');

    try {
      const permissionData: any = {
        resident_name: formData.residentName.trim(),
        phone_number: formData.phoneNumber.trim(),
        email: formData.email.trim() || null,
        flat_number: formData.flatNumber.trim(),
        wing: formData.wing.trim() || null,
        permission_text: formData.permissionText.trim(),
        permission_date: formData.permissionDate,
      };

      const { data, error } = await supabase
        .from('permissions')
        .update(permissionData)
        .eq('id', id)
        .select()
        .single();

      toast.dismiss(loadingToast);

      if (error) {
        console.error('Error updating permission:', error);
        toast.error(`Failed to update permission: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      toast.success('Permission updated successfully!');

      // Navigate back to permissions page after successful update
      setTimeout(() => {
        navigate('/permissions');
      }, 1000);
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to update permission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
            <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
          </div>
          <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading permission...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/permissions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Permissions
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Edit Permission
              </h1>
              <p className="text-muted-foreground">
                Update permission details
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-[#8c52ff]" />
                <span>Permission Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="residentName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Resident Name *
                  </Label>
                  <Input
                    id="residentName"
                    value={formData.residentName}
                    onChange={(e) => handleInputChange('residentName', e.target.value)}
                    placeholder="Enter resident name"
                    required
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                    required
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email Id
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permissionDate" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-gray-400" />
                    Permission Date *
                  </Label>
                  <Input
                    id="permissionDate"
                    type="date"
                    value={formData.permissionDate}
                    onChange={(e) => handleInputChange('permissionDate', e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flatNumber" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Flat Number *
                  </Label>
                  <Input
                    id="flatNumber"
                    value={formData.flatNumber}
                    onChange={(e) => handleInputChange('flatNumber', e.target.value)}
                    placeholder="Enter flat number"
                    required
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wing" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Wing
                  </Label>
                  <Input
                    id="wing"
                    value={formData.wing}
                    onChange={(e) => handleInputChange('wing', e.target.value)}
                    placeholder="Enter wing (optional)"
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissionText" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-gray-400" />
                  Permission Text *
                </Label>
                <Textarea
                  id="permissionText"
                  value={formData.permissionText}
                  onChange={(e) => handleInputChange('permissionText', e.target.value)}
                  placeholder="Enter permission details..."
                  required
                  disabled={isSubmitting}
                  rows={6}
                  className="border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Provide detailed information about the permission
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/permissions')} 
              disabled={isSubmitting}
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Permission'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

