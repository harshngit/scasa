import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Home, Building2, User, Phone, Mail, DollarSign, Users, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function CreateSocietyOwnedRoom() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance',
    shop_owner_name: '',
    shop_owner_phone: '',
    shop_owner_email: '',
    shop_office_name: '',
    office_telephone: '',
    workers_employees: '',
    manager_name: '',
    manager_phone: '',
    finance_month: '',
    finance_money: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.room_number.trim()) {
      toast.error('Please enter room number');
      return;
    }
    if (!formData.room_type) {
      toast.error('Please select room type');
      return;
    }
    if (!formData.status) {
      toast.error('Please select status');
      return;
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      const { error } = await supabase
        .from('society_owned_rooms')
        .insert([{
          room_number: formData.room_number,
          room_type: formData.room_type,
          status: formData.status,
          shop_owner_name: formData.shop_owner_name || null,
          shop_owner_phone: formData.shop_owner_phone || null,
          shop_owner_email: formData.shop_owner_email || null,
          shop_office_name: formData.shop_office_name || null,
          office_telephone: formData.office_telephone || null,
          workers_employees: formData.workers_employees ? parseInt(formData.workers_employees) : null,
          manager_name: formData.manager_name || null,
          manager_phone: formData.manager_phone || null,
          finance_month: formData.finance_month ? parseInt(formData.finance_month) : null,
          finance_money: formData.finance_money ? parseFloat(formData.finance_money) : null,
        }]);

      if (error) {
        console.error('Error creating room:', error);
        toast.error(`Failed to save: ${error.message}`);
        throw error;
      }

      toast.success('Room created successfully!');

      setTimeout(() => {
        navigate('/society-owned-rooms');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/society-owned-rooms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create New Room
              </h1>
              <p className="text-muted-foreground">
                Add a new society owned room with complete details
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Home className="h-5 w-5 text-[#8c52ff]" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="room_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#8c52ff]" />
                    Room Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="room_number"
                    value={formData.room_number}
                    onChange={(e) => handleInputChange('room_number', e.target.value)}
                    placeholder="e.g., R-101, G-01"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_type" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Room Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.room_type}
                    onValueChange={(value) => handleInputChange('room_type', value)}
                    required
                  >
                    <SelectTrigger id="room_type" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial-office">Commercial Office</SelectItem>
                      <SelectItem value="shop">Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                    required
                  >
                    <SelectTrigger id="status" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop_owner_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#8c52ff]" />
                    Shop Owner Name
                  </Label>
                  <Input
                    id="shop_owner_name"
                    value={formData.shop_owner_name}
                    onChange={(e) => handleInputChange('shop_owner_name', e.target.value)}
                    placeholder="Enter shop owner's name"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop_owner_phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Phone Number
                  </Label>
                  <Input
                    id="shop_owner_phone"
                    value={formData.shop_owner_phone}
                    onChange={(e) => handleInputChange('shop_owner_phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop_owner_email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#8c52ff]" />
                    Email Address
                  </Label>
                  <Input
                    id="shop_owner_email"
                    type="email"
                    value={formData.shop_owner_email}
                    onChange={(e) => handleInputChange('shop_owner_email', e.target.value)}
                    placeholder="Enter email address"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shop Details */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-[#8c52ff]" />
                Shop Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="shop_office_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Shop / Office Name
                  </Label>
                  <Input
                    id="shop_office_name"
                    value={formData.shop_office_name}
                    onChange={(e) => handleInputChange('shop_office_name', e.target.value)}
                    placeholder="Enter shop or office name"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office_telephone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Office Telephone Number
                  </Label>
                  <Input
                    id="office_telephone"
                    value={formData.office_telephone}
                    onChange={(e) => handleInputChange('office_telephone', e.target.value)}
                    placeholder="Enter office telephone number"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workers_employees" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8c52ff]" />
                    Workers Or Employees in the Office
                  </Label>
                  <Input
                    id="workers_employees"
                    type="number"
                    min="0"
                    value={formData.workers_employees}
                    onChange={(e) => handleInputChange('workers_employees', e.target.value)}
                    placeholder="Enter number of workers/employees"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager Details */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-[#8c52ff]" />
                Manager Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="manager_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#8c52ff]" />
                    Manager Name
                  </Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => handleInputChange('manager_name', e.target.value)}
                    placeholder="Enter manager's name"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Manager Phone Number
                  </Label>
                  <Input
                    id="manager_phone"
                    value={formData.manager_phone}
                    onChange={(e) => handleInputChange('manager_phone', e.target.value)}
                    placeholder="Enter manager's phone number"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finance Details */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="h-5 w-5 text-[#8c52ff]" />
                Finance Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="finance_month" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#8c52ff]" />
                    Month
                  </Label>
                  <Select
                    value={formData.finance_month}
                    onValueChange={(value) => handleInputChange('finance_month', value)}
                  >
                    <SelectTrigger id="finance_month" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finance_money" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#8c52ff]" />
                    Money (₹)
                  </Label>
                  <Input
                    id="finance_money"
                    type="number"
                    step="0.01"
                    value={formData.finance_money}
                    onChange={(e) => handleInputChange('finance_money', e.target.value)}
                    placeholder="Enter amount"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/society-owned-rooms')}
              className="h-12 px-6 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 h-12 px-8 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Home className="h-5 w-5 mr-2" />
                  Create Room
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
