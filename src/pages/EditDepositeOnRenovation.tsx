import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, DollarSign, Calendar, User, Phone, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Resident {
  id: string;
  flat_number: string;
  owner_name: string;
  phone_number: string;
}

export default function EditDepositeOnRenovation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [formData, setFormData] = useState({
    resident_id: '',
    flat_number: '',
    owner_name: '',
    phone_number: '',
    amount: '',
    deposit_date: '',
    status: 'pending' as 'pending' | 'refunded' | 'forfeited',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchDeposit(id);
      fetchResidents();
    }
  }, [id]);

  const fetchResidents = async () => {
    try {
      setLoadingResidents(true);
      const { data, error } = await supabase
        .from('residents')
        .select('id, flat_number, owner_name, phone_number')
        .order('flat_number', { ascending: true });

      if (error) throw error;
      setResidents(data || []);
    } catch (error: any) {
      console.error('Error fetching residents:', error);
      toast.error('Failed to fetch residents');
    } finally {
      setLoadingResidents(false);
    }
  };

  const fetchDeposit = async (depositId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('deposite_on_renovation')
        .select('*')
        .eq('id', depositId)
        .single();

      if (error) {
        console.error('Error fetching deposit:', error);
        toast.error('Failed to load deposit data');
        navigate('/expenses/deposite-on-renovation');
        return;
      }

      if (data) {
        setFormData({
          resident_id: data.resident_id || '',
          flat_number: data.flat_number || '',
          owner_name: data.owner_name || '',
          phone_number: data.phone_number || '',
          amount: data.amount ? data.amount.toString() : '',
          deposit_date: data.deposit_date || '',
          status: data.status || 'pending',
          notes: data.notes || '',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load deposit data');
      navigate('/expenses/deposite-on-renovation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFlatNumberChange = (flatNumber: string) => {
    const resident = residents.find(r => r.flat_number === flatNumber);
    if (resident) {
      setFormData({
        ...formData,
        resident_id: resident.id,
        flat_number: resident.flat_number,
        owner_name: resident.owner_name,
        phone_number: resident.phone_number
      });
    } else {
      setFormData({
        ...formData,
        resident_id: '',
        flat_number: flatNumber,
        owner_name: '',
        phone_number: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.flat_number.trim()) {
      toast.error('Please select or enter flat number');
      return;
    }
    if (!formData.amount.trim()) {
      toast.error('Please enter deposit amount');
      return;
    }
    if (!formData.deposit_date) {
      toast.error('Please select deposit date');
      return;
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      const { error } = await supabase
        .from('deposite_on_renovation')
        .update({
          resident_id: formData.resident_id || null,
          flat_number: formData.flat_number,
          owner_name: formData.owner_name || null,
          phone_number: formData.phone_number || null,
          amount: parseFloat(formData.amount),
          deposit_date: formData.deposit_date,
          status: formData.status,
          notes: formData.notes || null
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating deposit:', error);
        toast.error(`Failed to update: ${error.message}`);
        throw error;
      }

      toast.success('Deposit updated successfully!');

      setTimeout(() => {
        navigate(`/expenses/deposite-on-renovation/${id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error updating deposit:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to update deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading deposit data...</span>
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
          
          <div className="relative z-10 flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate(`/expenses/deposite-on-renovation/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Edit Deposit
              </h1>
              <p className="text-muted-foreground">
                Update deposit information and details
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >
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
                  <Label htmlFor="flat_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Flat Number <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.flat_number}
                    onValueChange={handleFlatNumberChange}
                    disabled={loadingResidents}
                    required
                  >
                    <SelectTrigger id="flat_number" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder={loadingResidents ? "Loading residents..." : "Select flat number"} />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map((resident) => (
                        <SelectItem key={resident.id} value={resident.flat_number}>
                          {resident.flat_number} - {resident.owner_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select from existing residents or enter manually</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#8c52ff]" />
                    Owner Name
                  </Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => handleInputChange('owner_name', e.target.value)}
                    placeholder="Auto-filled from flat selection"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="Auto-filled from flat selection"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#8c52ff]" />
                    Amount (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="Enter deposit amount"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_date" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#8c52ff]" />
                    Deposit Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="deposit_date"
                    type="date"
                    value={formData.deposit_date}
                    onChange={(e) => handleInputChange('deposit_date', e.target.value)}
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger id="status" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="forfeited">Forfeited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#8c52ff]" />
                    Notes
                  </Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Optional notes about the deposit..."
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
              onClick={() => navigate(`/expenses/deposite-on-renovation/${id}`)}
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
                  Updating...
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Update Deposit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

