import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, X, ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
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
  url?: string;
}

export default function EditResident() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: '',
    flatNumber: '',
    residencyType: '',
    phoneNumber: '',
    email: '',
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
        toast.error('Failed to load resident data');
        navigate('/residents');
        return;
      }

      if (data) {
        // Populate form with existing data
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
          monthlyRent: data.monthly_rent ? data.monthly_rent.toString() : '',
        });

        // Populate residents list
        if (data.residents_living && Array.isArray(data.residents_living)) {
          const residents = data.residents_living.map((r: any, index: number) => ({
            id: index.toString(),
            name: r.name || '',
            phoneNumber: r.phoneNumber || r.phone || '',
            dateJoined: r.dateJoined || ''
          }));
          setResidentsList(residents);
        }

        // Populate documents
        if (data.documents && Array.isArray(data.documents)) {
          const docs = data.documents.map((doc: any, index: number) => ({
            id: index.toString(),
            name: doc.name || '',
            type: doc.type || '',
            url: doc.url || ''
          }));
          setDocuments(docs);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load resident data');
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
      } else {
        // Keep existing URL if no new file uploaded
        const { data: existingData } = await supabase
          .from('residents')
          .select('rent_agreement_url')
          .eq('id', id)
          .single();
        rentAgreementUrl = existingData?.rent_agreement_url || null;
      }

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
          } else if (doc.url) {
            // Keep existing document
            documentsWithUrls.push({
              name: doc.name,
              type: doc.type,
              url: doc.url
            });
          }
        }
        toast.dismiss(documentsToastId);
        if (documentsWithUrls.length > 0) {
          toast.success(`${documentsWithUrls.length} document(s) processed`);
        }
      }

      const residentData: any = {
        owner_name: formData.ownerName,
        flat_number: formData.flatNumber,
        residency_type: formData.residencyType,
        phone_number: formData.phoneNumber,
        email: formData.email || null,
        residents_living: residentsLivingArray,
        documents: documentsWithUrls
      };

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

      const savingToastId = toast.loading('Updating resident data...');
      
      const { error } = await supabase
        .from('residents')
        .update(residentData)
        .eq('id', id);

      toast.dismiss(savingToastId);

      if (error) {
        console.error('Error updating resident:', error);
        toast.error(`Failed to update: ${error.message}`);
        throw error;
      }

      toast.success('Resident updated successfully!');
      
      setTimeout(() => {
        navigate(`/residents/${id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error updating resident:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to update resident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading resident data...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(`/residents/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Resident</h1>
            <p className="text-muted-foreground">
              Update resident information and details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Same form structure as CreateResident */}
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner's Name *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    placeholder="Enter owner's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flatNumber">Flat Number *</Label>
                  <Input
                    id="flatNumber"
                    value={formData.flatNumber}
                    onChange={(e) => handleInputChange('flatNumber', e.target.value)}
                    placeholder="e.g., A-101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residencyType">Residency Type *</Label>
                  <Select 
                    value={formData.residencyType} 
                    onValueChange={(value) => handleInputChange('residencyType', value)}
                    required
                  >
                    <SelectTrigger id="residencyType">
                      <SelectValue placeholder="Select residency type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner-living">Owner Living</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Information */}
          {formData.residencyType === 'rented' && (
            <Card>
              <CardHeader>
                <CardTitle>Rental Information</CardTitle>
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
                  <p className="text-xs text-muted-foreground">Leave empty to keep existing file</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Residents Living in Flat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="residentName">Name</Label>
                  <Input
                    id="residentName"
                    value={newResident.name}
                    onChange={(e) => setNewResident(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter resident name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residentPhone">Phone Number</Label>
                  <Input
                    id="residentPhone"
                    value={newResident.phoneNumber}
                    onChange={(e) => setNewResident(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateJoined">Date Joined</Label>
                  <Input
                    id="dateJoined"
                    type="date"
                    value={newResident.dateJoined}
                    onChange={(e) => setNewResident(prev => ({ ...prev, dateJoined: e.target.value }))}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addResident();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resident
                </Button>
              </div>

              {residentsList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Residents:</h4>
                  {residentsList.map((resident) => (
                    <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <span className="font-medium">{resident.name}</span>
                        <span className="text-muted-foreground">{resident.phoneNumber}</span>
                        <span className="text-muted-foreground">{new Date(resident.dateJoined).toLocaleDateString()}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeResident(resident.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Additional Documents</CardTitle>
                <Button type="button" variant="outline" onClick={addDocument}>
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
                    {document.url && (
                      <p className="text-xs text-muted-foreground">Existing file will be replaced</p>
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
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/residents/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Resident'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

