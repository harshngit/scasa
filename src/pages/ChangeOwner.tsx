import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Upload, ArrowLeft, Users, FileText, Home, Calendar, User, Phone, Mail, Loader2, Car } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResidentLiving {
  id: string;
  name: string;
  phoneNumber: string;
  dateJoined: string;
}

interface VehicleDetail {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  file?: File;
  url?: string;
}

interface ResidentData {
  id: string;
  owner_name: string;
  flat_number: string;
  residency_type: 'owner-living' | 'rented';
  phone_number: string;
  email: string | null;
  rent_agreement_url: string | null;
  current_renter_name: string | null;
  current_renter_phone: string | null;
  current_renter_email: string | null;
  old_renter_name: string | null;
  old_renter_phone: string | null;
  old_renter_email: string | null;
  rent_start_date: string | null;
  rent_end_date: string | null;
  monthly_rent: number | null;
  broker_name: string | null;
  broker_phone: string | null;
  broker_email: string | null;
  broker_company: string | null;
  broker_commission: number | null;
  residents_living: any[];
  vehicle_detail: any[];
  documents: any[];
  owner_history: any[];
}

export default function ChangeOwner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentResident, setCurrentResident] = useState<ResidentData | null>(null);
  
  const [formData, setFormData] = useState({
    ownerName: '',
    flatNumber: '',
    residencyType: '',
    phoneNumber: '',
    email: '',
    // Rental specific fields
    rentAgreement: null as File | null,
    currentRenterName: '',
    currentRenterPhone: '',
    currentRenterEmail: '',
    oldRenterName: '',
    oldRenterPhone: '',
    oldRenterEmail: '',
    rentStartDate: '',
    rentEndDate: '',
    monthlyRent: '',
    // Broker details
    brokerName: '',
    brokerPhone: '',
    brokerEmail: '',
    brokerCompany: '',
    brokerCommission: '',
  });

  const [residentsList, setResidentsList] = useState<ResidentLiving[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newResident, setNewResident] = useState({
    name: '',
    phoneNumber: '',
    dateJoined: ''
  });

  const [vehicles, setVehicles] = useState<VehicleDetail[]>([]);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: '',
    vehicleType: ''
  });

  // Fetch current resident data
  useEffect(() => {
    if (id) {
      fetchResident(id);
    }
  }, [id]);

  const fetchResident = async (residentId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('id', residentId)
        .single();

      if (error) {
        console.error('Error fetching resident:', error);
        toast.error('Failed to load resident details');
        navigate('/residents');
        return;
      }

      setCurrentResident(data);
      
      // Pre-fill form with current data
      setFormData({
        ownerName: data.owner_name || '',
        flatNumber: data.flat_number || '',
        residencyType: data.residency_type || '',
        phoneNumber: data.phone_number || '',
        email: data.email || '',
        rentAgreement: null,
        currentRenterName: data.current_renter_name || '',
        currentRenterPhone: data.current_renter_phone || '',
        currentRenterEmail: data.current_renter_email || '',
        oldRenterName: data.old_renter_name || '',
        oldRenterPhone: data.old_renter_phone || '',
        oldRenterEmail: data.old_renter_email || '',
        rentStartDate: data.rent_start_date || '',
        rentEndDate: data.rent_end_date || '',
        monthlyRent: data.monthly_rent?.toString() || '',
        brokerName: data.broker_name || '',
        brokerPhone: data.broker_phone || '',
        brokerEmail: data.broker_email || '',
        brokerCompany: data.broker_company || '',
        brokerCommission: data.broker_commission?.toString() || '',
      });

      // Pre-fill residents living
      if (data.residents_living && Array.isArray(data.residents_living)) {
        const residents = data.residents_living.map((r: any, idx: number) => ({
          id: idx.toString(),
          name: r.name || '',
          phoneNumber: r.phoneNumber || r.phone || '',
          dateJoined: r.dateJoined || r.date_joined || ''
        }));
        setResidentsList(residents);
      }

      // Pre-fill vehicles
      if (data.vehicle_detail && Array.isArray(data.vehicle_detail)) {
        const vehicles = data.vehicle_detail.map((v: any, idx: number) => ({
          id: idx.toString(),
          vehicleNumber: v.vehicleNumber || v.vehicle_number || '',
          vehicleType: v.vehicleType || v.vehicle_type || ''
        }));
        setVehicles(vehicles);
      }

      // Pre-fill documents
      if (data.documents && Array.isArray(data.documents)) {
        const docs = data.documents.map((d: any, idx: number) => ({
          id: idx.toString(),
          name: d.name || '',
          type: d.type || '',
          url: d.url || ''
        }));
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load resident details');
      navigate('/residents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const addResident = () => {
    if (!newResident.name.trim()) {
      toast.error('Please enter resident name');
      return;
    }
    if (!newResident.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    if (!newResident.dateJoined) {
      toast.error('Please select date joined');
      return;
    }

    const resident: ResidentLiving = {
      id: Date.now().toString(),
      name: newResident.name.trim(),
      phoneNumber: newResident.phoneNumber.trim(),
      dateJoined: newResident.dateJoined
    };
    setResidentsList(prev => [...prev, resident]);
    setNewResident({ name: '', phoneNumber: '', dateJoined: '' });
    toast.success('Resident added successfully');
  };

  const removeResident = (id: string) => {
    setResidentsList(prev => prev.filter(resident => resident.id !== id));
  };

  const addVehicle = () => {
    if (!newVehicle.vehicleNumber.trim()) {
      toast.error('Please enter vehicle number');
      return;
    }
    if (!newVehicle.vehicleType) {
      toast.error('Please select vehicle type');
      return;
    }

    const vehicle: VehicleDetail = {
      id: Date.now().toString(),
      vehicleNumber: newVehicle.vehicleNumber.trim(),
      vehicleType: newVehicle.vehicleType
    };

    setVehicles(prev => [...prev, vehicle]);
    setNewVehicle({ vehicleNumber: '', vehicleType: '' });
    toast.success('Vehicle added successfully');
  };

  const removeVehicle = (id: string) => {
    setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
  };

  const addDocument = () => {
    const document: Document = {
      id: Date.now().toString(),
      name: '',
      type: ''
    };
    setDocuments(prev => [...prev, document]);
  };

  const updateDocument = (id: string, field: string, value: string | File) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, folder: string, fileName: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${folder}/${fileName}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('residents-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('residents-documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ownerName.trim()) {
      toast.error('Please enter owner name');
      return;
    }
    if (!formData.flatNumber.trim()) {
      toast.error('Please enter flat number');
      return;
    }
    if (!formData.residencyType) {
      toast.error('Please select residency type');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    if (formData.residencyType === 'rented') {
      if (!formData.currentRenterName?.trim()) {
        toast.error('Please enter current renter name');
        return;
      }
      if (!formData.currentRenterPhone?.trim()) {
        toast.error('Please enter current renter phone number');
        return;
      }
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      if (!currentResident) {
        throw new Error('Current resident data not found');
      }

      // Build residents_living array
      let residentsLivingArray: any[] = [];

      if (formData.residencyType === 'owner-living') {
        residentsLivingArray = residentsList.map(resident => ({
          name: resident.name,
          phoneNumber: resident.phoneNumber,
          dateJoined: resident.dateJoined
        }));
      } else if (formData.residencyType === 'rented') {
        if (formData.currentRenterName && formData.currentRenterPhone) {
          residentsLivingArray.push({
            name: formData.currentRenterName,
            phoneNumber: formData.currentRenterPhone,
            email: formData.currentRenterEmail || null,
            dateJoined: formData.rentStartDate || null,
            isRenter: true
          });
        }

        residentsList.forEach(resident => {
          residentsLivingArray.push({
            name: resident.name,
            phoneNumber: resident.phoneNumber,
            dateJoined: resident.dateJoined,
            isRenter: false
          });
        });
      }

      // Upload rent agreement if new file is provided
      let rentAgreementUrl: string | null = currentResident.rent_agreement_url;
      if (formData.rentAgreement) {
        const rentAgreementToastId = toast.loading('Uploading rent agreement...');
        rentAgreementUrl = await uploadFile(
          formData.rentAgreement,
          'rent-agreements',
          `rent-agreement-${formData.flatNumber}`
        );
        toast.dismiss(rentAgreementToastId);
        if (!rentAgreementUrl) {
          throw new Error('Failed to upload rent agreement');
        }
        toast.success('Rent agreement uploaded');
      }

      // Upload new document files
      const documentsWithUrls: any[] = [];
      const existingDocuments = documents.filter(doc => doc.url && !doc.file);
      documentsWithUrls.push(...existingDocuments.map(doc => ({
        name: doc.name,
        type: doc.type,
        url: doc.url
      })));

      let documentsToastId: string | number | undefined;
      const newDocuments = documents.filter(doc => doc.file);
      if (newDocuments.length > 0) {
        documentsToastId = toast.loading('Uploading documents...');
        for (const doc of newDocuments) {
          if (doc.file && doc.name && doc.type) {
            const fileUrl = await uploadFile(
              doc.file,
              'documents',
              `${doc.type}-${doc.name}`
            );
            if (fileUrl) {
              documentsWithUrls.push({
                name: doc.name,
                type: doc.type,
                url: fileUrl
              });
            }
          }
        }
        toast.dismiss(documentsToastId);
        if (newDocuments.length > 0) {
          toast.success(`${newDocuments.length} document(s) uploaded`);
        }
      }

      // Build vehicle_detail array
      const vehicleDetailArray = vehicles.map(vehicle => ({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
      }));

      // Prepare old owner data for history
      const oldOwnerData = {
        owner_name: currentResident.owner_name,
        phone_number: currentResident.phone_number,
        email: currentResident.email,
        residency_type: currentResident.residency_type,
        residents_living: currentResident.residents_living || [],
        vehicle_detail: currentResident.vehicle_detail || [],
        documents: currentResident.documents || [],
        rent_agreement_url: currentResident.rent_agreement_url,
        current_renter_name: currentResident.current_renter_name,
        current_renter_phone: currentResident.current_renter_phone,
        current_renter_email: currentResident.current_renter_email,
        old_renter_name: currentResident.old_renter_name,
        old_renter_phone: currentResident.old_renter_phone,
        old_renter_email: currentResident.old_renter_email,
        rent_start_date: currentResident.rent_start_date,
        rent_end_date: currentResident.rent_end_date,
        monthly_rent: currentResident.monthly_rent,
        broker_name: currentResident.broker_name,
        broker_phone: currentResident.broker_phone,
        broker_email: currentResident.broker_email,
        broker_company: currentResident.broker_company,
        broker_commission: currentResident.broker_commission,
        changed_at: new Date().toISOString()
      };

      // Get existing owner_history or initialize as empty array
      const existingHistory = currentResident.owner_history || [];
      const updatedHistory = [...existingHistory, oldOwnerData];

      // Prepare new owner data
      const residentData: any = {
        owner_name: formData.ownerName,
        flat_number: formData.flatNumber,
        residency_type: formData.residencyType,
        phone_number: formData.phoneNumber,
        email: formData.email || null,
        residents_living: residentsLivingArray,
        vehicle_detail: vehicleDetailArray,
        documents: documentsWithUrls,
        owner_history: updatedHistory
      };

      // Add rental information if residency type is rented
      if (formData.residencyType === 'rented') {
        residentData.rent_agreement_url = rentAgreementUrl;
        residentData.current_renter_name = formData.currentRenterName || null;
        residentData.current_renter_phone = formData.currentRenterPhone || null;
        residentData.current_renter_email = formData.currentRenterEmail || null;
        residentData.old_renter_name = formData.oldRenterName || null;
        residentData.old_renter_phone = formData.oldRenterPhone || null;
        residentData.old_renter_email = formData.oldRenterEmail || null;
        residentData.rent_start_date = formData.rentStartDate || null;
        residentData.rent_end_date = formData.rentEndDate || null;
        residentData.monthly_rent = formData.monthlyRent ? parseFloat(formData.monthlyRent) : null;
        residentData.broker_name = formData.brokerName || null;
        residentData.broker_phone = formData.brokerPhone || null;
        residentData.broker_email = formData.brokerEmail || null;
        residentData.broker_company = formData.brokerCompany || null;
        residentData.broker_commission = formData.brokerCommission ? parseFloat(formData.brokerCommission) : null;
      } else {
        // Clear rental fields if changing to owner-living
        residentData.rent_agreement_url = null;
        residentData.current_renter_name = null;
        residentData.current_renter_phone = null;
        residentData.current_renter_email = null;
        residentData.old_renter_name = null;
        residentData.old_renter_phone = null;
        residentData.old_renter_email = null;
        residentData.rent_start_date = null;
        residentData.rent_end_date = null;
        residentData.monthly_rent = null;
        residentData.broker_name = null;
        residentData.broker_phone = null;
        residentData.broker_email = null;
        residentData.broker_company = null;
        residentData.broker_commission = null;
      }

      // Update the resident record
      const savingToastId = toast.loading('Updating owner information...');

      const { error } = await supabase
        .from('residents')
        .update(residentData)
        .eq('id', currentResident.id);

      toast.dismiss(savingToastId);

      if (error) {
        console.error('Error updating resident:', error);
        toast.error(`Failed to update: ${error.message}`);
        throw error;
      }

      toast.success('Owner changed successfully!');
      setTimeout(() => {
        navigate(`/residents/${currentResident.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error changing owner:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to change owner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading resident details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentResident) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Resident Not Found</h3>
            <p className="text-muted-foreground">The requested resident could not be found.</p>
            <Button onClick={() => navigate('/residents')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Residents
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate(`/residents/${currentResident.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resident
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Change Owner
              </h1>
              <p className="text-muted-foreground">
                Update owner information for Flat {currentResident.flat_number}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-[#8c52ff]" />
                New Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Owner's Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    placeholder="Enter owner's full name"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flatNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Flat Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="flatNumber"
                    value={formData.flatNumber}
                    onChange={(e) => handleInputChange('flatNumber', e.target.value)}
                    placeholder="e.g., A-101"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residencyType" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Residency Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.residencyType}
                    onValueChange={(value) => handleInputChange('residencyType', value)}
                    required
                  >
                    <SelectTrigger id="residencyType" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select residency type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner-living">Owner Living</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Information - Only show if residency type is rented */}
          {formData.residencyType === 'rented' && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Home className="h-5 w-5 text-[#8c52ff]" />
                  Rental Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAgreement">Rent Agreement</Label>
                  <Input
                    id="rentAgreement"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload('rentAgreement', e.target.files?.[0] || null)}
                  />
                  {currentResident.rent_agreement_url && (
                    <p className="text-sm text-muted-foreground">
                      Current: <a href={currentResident.rent_agreement_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View current agreement</a>
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Current Renter Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentRenterName">Renter Name *</Label>
                      <Input
                        id="currentRenterName"
                        value={formData.currentRenterName}
                        onChange={(e) => handleInputChange('currentRenterName', e.target.value)}
                        placeholder="Enter renter's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentRenterPhone">Phone Number *</Label>
                      <Input
                        id="currentRenterPhone"
                        value={formData.currentRenterPhone}
                        onChange={(e) => handleInputChange('currentRenterPhone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentRenterEmail">Email Address</Label>
                      <Input
                        id="currentRenterEmail"
                        type="email"
                        value={formData.currentRenterEmail}
                        onChange={(e) => handleInputChange('currentRenterEmail', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Previous Renter Details (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldRenterName">Previous Renter Name</Label>
                      <Input
                        id="oldRenterName"
                        value={formData.oldRenterName}
                        onChange={(e) => handleInputChange('oldRenterName', e.target.value)}
                        placeholder="Enter previous renter's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oldRenterPhone">Phone Number</Label>
                      <Input
                        id="oldRenterPhone"
                        value={formData.oldRenterPhone}
                        onChange={(e) => handleInputChange('oldRenterPhone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oldRenterEmail">Email Address</Label>
                      <Input
                        id="oldRenterEmail"
                        type="email"
                        value={formData.oldRenterEmail}
                        onChange={(e) => handleInputChange('oldRenterEmail', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rentStartDate">Rent Start Date</Label>
                    <Input
                      id="rentStartDate"
                      type="date"
                      value={formData.rentStartDate}
                      onChange={(e) => handleInputChange('rentStartDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rentEndDate">Rent End Date</Label>
                    <Input
                      id="rentEndDate"
                      type="date"
                      value={formData.rentEndDate}
                      onChange={(e) => handleInputChange('rentEndDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      placeholder="Enter monthly rent amount"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Broker Details (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brokerName">Broker Name</Label>
                      <Input
                        id="brokerName"
                        value={formData.brokerName}
                        onChange={(e) => handleInputChange('brokerName', e.target.value)}
                        placeholder="Enter broker's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerPhone">Broker Phone Number</Label>
                      <Input
                        id="brokerPhone"
                        value={formData.brokerPhone}
                        onChange={(e) => handleInputChange('brokerPhone', e.target.value)}
                        placeholder="Enter broker's phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerEmail">Broker Email</Label>
                      <Input
                        id="brokerEmail"
                        type="email"
                        value={formData.brokerEmail}
                        onChange={(e) => handleInputChange('brokerEmail', e.target.value)}
                        placeholder="Enter broker's email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerCommission">Broker Commission (₹)</Label>
                      <Input
                        id="brokerCommission"
                        type="number"
                        value={formData.brokerCommission}
                        onChange={(e) => handleInputChange('brokerCommission', e.target.value)}
                        placeholder="Enter commission amount"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Residents Living List */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-[#8c52ff]" />
                Residents Living in Flat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/10 dark:to-pink-950/10 rounded-xl border border-purple-100 dark:border-purple-900/50">
                <div className="space-y-2">
                  <Label htmlFor="residentName" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#8c52ff]" />
                    Name
                  </Label>
                  <Input
                    id="residentName"
                    value={newResident.name}
                    onChange={(e) => setNewResident(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter resident name"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residentPhone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#8c52ff]" />
                    Phone Number
                  </Label>
                  <Input
                    id="residentPhone"
                    value={newResident.phoneNumber}
                    onChange={(e) => setNewResident(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateJoined" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#8c52ff]" />
                    Date Joined
                  </Label>
                  <Input
                    id="dateJoined"
                    type="date"
                    value={newResident.dateJoined}
                    onChange={(e) => setNewResident(prev => ({ ...prev, dateJoined: e.target.value }))}
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20 bg-white"
                  />
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addResident();
                  }}
                  className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 h-12 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Add Resident</span>
                </Button>
              </div>

              {residentsList.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#8c52ff]" />
                    Added Residents ({residentsList.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Name</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Phone Number</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Date Joined</th>
                          <th className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {residentsList.map((resident, idx) => (
                          <tr 
                            key={resident.id} 
                            className={cn(
                              "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                              "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                              idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                            )}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8c52ff] to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {resident.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{resident.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{resident.phoneNumber}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{new Date(resident.dateJoined).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeResident(resident.id)}
                                className="h-9 w-9 p-0 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Car className="h-5 w-5 text-[#8c52ff]" />
                Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/10 dark:to-pink-950/10 rounded-xl border border-purple-100 dark:border-purple-900/50">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    Vehicle Number
                  </Label>
                  <Input
                    id="vehicleNumber"
                    value={newVehicle.vehicleNumber}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    placeholder="e.g., MH-01-AB-1234"
                    className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    Vehicle Type
                  </Label>
                  <Select
                    value={newVehicle.vehicleType}
                    onValueChange={(value) => setNewVehicle(prev => ({ ...prev, vehicleType: value }))}
                  >
                    <SelectTrigger id="vehicleType" className="h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="bike">Bike</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addVehicle();
                  }}
                  className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 h-12 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Add Vehicle</span>
                </Button>
              </div>

              {vehicles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Car className="h-5 w-5 text-[#8c52ff]" />
                    Added Vehicles ({vehicles.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Vehicle Number</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Type</th>
                          <th className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-colors duration-200"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8c52ff] to-purple-600 flex items-center justify-center text-white font-semibold">
                                  <Car className="h-5 w-5" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.vehicleNumber}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 capitalize text-gray-700 dark:text-gray-300">
                              {vehicle.vehicleType}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeVehicle(vehicle.id)}
                                className="h-9 w-9 p-0 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-[#8c52ff]" />
                  Additional Documents
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addDocument}
                  className="border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((document) => (
                <div key={document.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input
                      value={document.name}
                      onChange={(e) => updateDocument(document.id, 'name', e.target.value)}
                      placeholder="Enter document name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={document.type} onValueChange={(value) => updateDocument(document.id, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id-proof">ID Proof</SelectItem>
                        <SelectItem value="address-proof">Address Proof</SelectItem>
                        <SelectItem value="income-proof">Income Proof</SelectItem>
                        <SelectItem value="police-verification">Police Verification</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateDocument(document.id, 'file', file);
                        }
                      }}
                    />
                    {document.url && !document.file && (
                      <p className="text-xs text-muted-foreground">
                        Current: <a href={document.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeDocument(document.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {documents.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No additional documents added. Click "Add Document" to upload supporting documents.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/residents/${currentResident.id}`)}
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
                  <User className="h-5 w-5 mr-2" />
                  Change Owner
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

