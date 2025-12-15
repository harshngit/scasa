import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Upload, ArrowLeft, Users, FileText, Home, Calendar, User, Phone, Mail, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ResidentLiving {
  id: string;
  name: string;
  phoneNumber: string;
  dateJoined: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  file?: File;
}

export default function CreateResident() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });

  const [residentsList, setResidentsList] = useState<ResidentLiving[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newResident, setNewResident] = useState({
    name: '',
    phoneNumber: '',
    dateJoined: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const addResident = () => {
    // Validate required fields
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

    // Add resident to the list
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

      // Get public URL
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

    // Validate required fields
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

    // Validate rental information if rented (make rent agreement optional for now)
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

    // Dismiss any existing toasts
    toast.dismiss();

    try {
      console.log('Form submission started...');
      // Build residents_living array based on residency type
      let residentsLivingArray: any[] = [];

      if (formData.residencyType === 'owner-living') {
        // For owner-living: use the residentsList
        residentsLivingArray = residentsList.map(resident => ({
          name: resident.name,
          phoneNumber: resident.phoneNumber,
          dateJoined: resident.dateJoined
        }));
      } else if (formData.residencyType === 'rented') {
        // For rented: include current renter (if filled) + residentsList
        if (formData.currentRenterName && formData.currentRenterPhone) {
          residentsLivingArray.push({
            name: formData.currentRenterName,
            phoneNumber: formData.currentRenterPhone,
            email: formData.currentRenterEmail || null,
            dateJoined: formData.rentStartDate || null,
            isRenter: true
          });
        }

        // Add additional residents from the list
        residentsList.forEach(resident => {
          residentsLivingArray.push({
            name: resident.name,
            phoneNumber: resident.phoneNumber,
            dateJoined: resident.dateJoined,
            isRenter: false
          });
        });
      }

      // Upload rent agreement file if exists
      let rentAgreementUrl: string | null = null;
      let rentAgreementToastId: string | number | undefined;
      if (formData.rentAgreement) {
        rentAgreementToastId = toast.loading('Uploading rent agreement...');
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

      // Upload document files
      const documentsWithUrls: any[] = [];
      let documentsToastId: string | number | undefined;
      if (documents.length > 0) {
        documentsToastId = toast.loading('Uploading documents...');
        for (const doc of documents) {
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
        if (documentsWithUrls.length > 0) {
          toast.success(`${documentsWithUrls.length} document(s) uploaded`);
        }
      }

      // Prepare data for database
      const residentData: any = {
        owner_name: formData.ownerName,
        flat_number: formData.flatNumber,
        residency_type: formData.residencyType,
        phone_number: formData.phoneNumber,
        email: formData.email || null,
        residents_living: residentsLivingArray,
        documents: documentsWithUrls
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
      }

      // Insert into database
      console.log('Inserting data into database:', residentData);
      const savingToastId = toast.loading('Saving resident data...');

      const { data, error } = await supabase
        .from('residents')
        .insert([residentData])
        .select();

      // Dismiss loading toast before showing result
      toast.dismiss(savingToastId);

      if (error) {
        console.error('Error saving resident:', error);
        toast.error(`Failed to save: ${error.message}`);
        throw error;
      }

      console.log('Resident created successfully:', data);
      toast.success('Resident created successfully!');

      // Navigate back to residents page after successful creation
      setTimeout(() => {
        navigate('/residents');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating resident:', error);
      // Dismiss all loading toasts on error
      toast.dismiss();
      toast.error(error.message || 'Failed to create resident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Animated wave pattern */}
          <svg className="absolute bottom-0 left-0 w-full h-20 opacity-10" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M0,60 C300,20 600,100 900,60 C1050,40 1150,50 1200,60 L1200,120 L0,120 Z"
              fill="url(#waveGradient)"
            >
              <animate
                attributeName="d"
                dur="10s"
                repeatCount="indefinite"
                values="M0,60 C300,20 600,100 900,60 C1050,40 1150,50 1200,60 L1200,120 L0,120 Z;
                        M0,80 C300,40 600,80 900,80 C1050,60 1150,70 1200,80 L1200,120 L0,120 Z;
                        M0,60 C300,20 600,100 900,60 C1050,40 1150,50 1200,60 L1200,120 L0,120 Z"
              />
            </path>
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8c52ff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-between">
            {/* Left Side - Content */}
            <div className="flex-1 animate-fade-in">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-gradient">
                Create New Resident
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Add a new resident with complete details and documentation
              </p>
            </div>

            {/* Right Side - Button */}
            <div className="ml-6 animate-slide-in-right">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/residents')}
                className="group/btn border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-6 py-6 h-auto"
              >
                <ArrowLeft className="h-5 w-5 mr-2 transition-transform duration-300 group-hover/btn:-translate-x-1" />
                <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover/btn:text-[#8c52ff] transition-colors">
                  Back to Residents
                </span>
              </Button>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            console.log('Form submitted');
            handleSubmit(e);
          }}
          className="space-y-6"
          noValidate
        >
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-[#8c52ff]" />
                Basic Information
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
                    onValueChange={(value) => {
                      handleInputChange('residencyType', value);
                    }}
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
                  <Label htmlFor="rentAgreement">Rent Agreement *</Label>
                  <Input
                    id="rentAgreement"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload('rentAgreement', e.target.files?.[0] || null)}
                  />
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
              onClick={() => navigate('/residents')}
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
                  <Plus className="h-5 w-5 mr-2" />
                  Create Resident
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}