import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, HandHeart, Loader2, User, X, Upload, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

interface ResidentData {
  id: string;
  flat_number: string;
  owner_name: string;
  residency_type: 'owner-living' | 'rented';
  phone_number: string;
  current_renter_name: string | null;
  current_renter_phone: string | null;
}

interface SelectedFlat {
  flatId: string;
  flatNumber: string;
  ownerName: string;
  ownerPhone: string;
  renterName: string | null;
  renterPhone: string | null;
  residencyType: 'owner-living' | 'rented';
}

export default function CreateHelper() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    helperName: '',
    gender: '',
    phoneNumber: '',
    helperType: '',
    helperWork: '',
    wing: '',
    secretary: '',
  });
  const [selectedFlats, setSelectedFlats] = useState<SelectedFlat[]>([]);
  const [availableFlats, setAvailableFlats] = useState<ResidentData[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = useState(false);
  const [flatSearchTerm, setFlatSearchTerm] = useState('');
  const [showFlatSelector, setShowFlatSelector] = useState(false);
  const [helperPhoto, setHelperPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [hasFetchedFlats, setHasFetchedFlats] = useState(false);

  useEffect(() => {
    if (formData.helperType === 'Home' && !hasFetchedFlats) {
      fetchFlats();
      setHasFetchedFlats(true);
    } else if (formData.helperType !== 'Home') {
      setHasFetchedFlats(false);
    }
  }, [formData.helperType]);

  const fetchFlats = async () => {
    try {
      setIsLoadingFlats(true);
      const { data, error } = await supabase
        .from('residents')
        .select('id, flat_number, owner_name, residency_type, phone_number, current_renter_name, current_renter_phone')
        .order('flat_number', { ascending: true });

      if (error) throw error;
      setAvailableFlats(data || []);
    } catch (error: any) {
      console.error('Error fetching flats:', error);
      toast.error('Failed to load flats');
    } finally {
      setIsLoadingFlats(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear selected flats when helper type changes
    if (field === 'helperType' && value !== 'Home') {
      setSelectedFlats([]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setHelperPhoto(event.target?.result as string);
        setPhotoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setHelperPhoto(null);
    setPhotoFile(null);
  };

  const toggleFlatSelection = (flat: ResidentData, checked: boolean) => {
    if (checked) {
      const selectedFlat: SelectedFlat = {
        flatId: flat.id,
        flatNumber: flat.flat_number,
        ownerName: flat.owner_name,
        ownerPhone: flat.phone_number,
        renterName: flat.current_renter_name,
        renterPhone: flat.current_renter_phone,
        residencyType: flat.residency_type,
      };
      setSelectedFlats(prev => [...prev, selectedFlat]);
    } else {
      setSelectedFlats(prev => prev.filter(sf => sf.flatId !== flat.id));
    }
  };

  const removeFlat = (flatId: string) => {
    setSelectedFlats(prev => prev.filter(sf => sf.flatId !== flatId));
  };

  const filteredFlats = availableFlats.filter(flat =>
    flat.flat_number.toLowerCase().includes(flatSearchTerm.toLowerCase()) ||
    flat.owner_name.toLowerCase().includes(flatSearchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    if (!formData.helperName.trim()) {
      toast.error('Please enter helper name');
      return false;
    }
    if (!formData.gender) {
      toast.error('Please select gender');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return false;
    }
    if (!formData.helperType) {
      toast.error('Please select helper type');
      return false;
    }
    if (formData.helperType === 'Home' && selectedFlats.length === 0) {
      toast.error('Please select at least one flat/room');
      return false;
    }
    if (formData.helperType === 'Home' && !formData.helperWork.trim()) {
      toast.error('Please enter helper work');
      return false;
    }
    if (formData.helperType === 'Society') {
      if (!formData.wing.trim()) {
        toast.error('Please enter wing');
        return false;
      }
      if (!formData.secretary.trim()) {
        toast.error('Please enter secretary name');
        return false;
      }
      if (!formData.helperWork.trim()) {
        toast.error('Please enter helper work');
        return false;
      }
    }
    return true;
  };

  const uploadPhotoToStorage = async (): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `helpers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('helper-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, store as base64 in database
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {
          console.warn('Storage bucket not found, storing photo as base64 in database');
          toast.warning('Storage bucket not configured. Photo will be stored in database.');
          // Return base64 data URL
          return helperPhoto;
        }
        console.error('Error uploading photo:', uploadError);
        // Fallback to base64 for any other error
        return helperPhoto;
      }

      const { data } = supabase.storage.from('helper-photos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      // Fallback to base64
      if (error?.message?.includes('Bucket not found') || error?.message?.includes('404')) {
        toast.warning('Storage bucket not configured. Photo will be stored in database.');
      }
      return helperPhoto;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating helper...');

    try {
      // Upload photo if exists
      let photoUrl = null;
      if (helperPhoto) {
        photoUrl = await uploadPhotoToStorage();
      }

      const helperData: any = {
        name: formData.helperName.trim(),
        gender: formData.gender,
        phone: formData.phoneNumber.trim(),
        helper_type: formData.helperType,
        helper_work: formData.helperWork.trim(),
        photo_url: photoUrl,
      };

      if (formData.helperType === 'Home') {
        helperData.rooms = selectedFlats.map(sf => sf.flatNumber);
        helperData.flat_details = selectedFlats.map(sf => ({
          flat_number: sf.flatNumber,
          owner_name: sf.ownerName,
          owner_phone: sf.ownerPhone,
          renter_name: sf.renterName,
          renter_phone: sf.renterPhone,
          residency_type: sf.residencyType,
        }));
      } else if (formData.helperType === 'Society') {
        helperData.wing = formData.wing.trim();
        helperData.secretary = formData.secretary.trim();
      }

      const { data, error } = await supabase
        .from('helpers')
        .insert([helperData])
        .select()
        .single();

      toast.dismiss(loadingToast);

      if (error) {
        console.error('Error creating helper:', error);
        toast.error(`Failed to create helper: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      toast.success('Helper created successfully!');

      // Navigate back to helpers page after successful creation
      setTimeout(() => {
        navigate('/helpers');
      }, 1000);
    } catch (error: any) {
      console.error('Error creating helper:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to create helper. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/helpers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Helpers
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Helper</h1>
            <p className="text-muted-foreground">
              Add a new helper with complete details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HandHeart className="h-5 w-5" />
                <span>Helper Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="helperName">Helper Name *</Label>
                  <Input
                    id="helperName"
                    value={formData.helperName}
                    onChange={(e) => handleInputChange('helperName', e.target.value)}
                    placeholder="Enter helper name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Helper Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="helperType">Helper Type *</Label>
                  <Select
                    value={formData.helperType}
                    onValueChange={(value) => handleInputChange('helperType', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select helper type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Society">Society</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Helper Photo</Label>
                <div className="flex items-center gap-4">
                  {helperPhoto ? (
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={helperPhoto} alt="Helper" />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removePhoto}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={isSubmitting}
                        className="hidden"
                        id="photo-upload"
                      />
                      <Label
                        htmlFor="photo-upload"
                        className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#8c52ff] transition-colors"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                      </Label>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Upload a photo of the helper (Max 5MB)
                    </p>
                    {!helperPhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={isSubmitting}
                        className="mt-2"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Home Helper Type Fields */}
              {formData.helperType === 'Home' && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#8c52ff]" />
                      <Label className="text-base font-semibold">Rooms / Flats *</Label>
                    </div>
                    
                    {/* Selected Flats Table */}
                    {selectedFlats.length > 0 && (
                      <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
                              <div>Flat No.</div>
                              <div>Owner Name</div>
                              <div>Owner Phone</div>
                              <div>Renter Name & Phone</div>
                              <div className="text-right">Action</div>
                            </div>
                            {selectedFlats.map((flat) => (
                              <div
                                key={flat.flatId}
                                className="grid grid-cols-5 gap-4 items-center py-2 border-b last:border-b-0"
                              >
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {flat.flatNumber}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {flat.ownerName}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {flat.ownerPhone}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {flat.residencyType === 'rented' && flat.renterName ? (
                                    <div>
                                      <div className="font-medium">{flat.renterName}</div>
                                      <div className="text-xs text-muted-foreground">{flat.renterPhone}</div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    onClick={() => removeFlat(flat.flatId)}
                                    disabled={isSubmitting}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Flat Selector */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">Select Flats / Rooms</CardTitle>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFlatSelector(!showFlatSelector)}
                            disabled={isSubmitting}
                          >
                            {showFlatSelector ? 'Hide' : 'Show'} List
                          </Button>
                        </div>
                      </CardHeader>
                      {showFlatSelector && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <Input
                              placeholder="Search flats by number or owner name..."
                              value={flatSearchTerm}
                              onChange={(e) => setFlatSearchTerm(e.target.value)}
                              className="mb-3"
                            />
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                              {/* Header Row */}
                              <div className="grid grid-cols-5 gap-3 p-3 bg-gray-50 dark:bg-gray-800 border-b font-semibold text-sm text-gray-700 dark:text-gray-300 sticky top-0">
                                <div className="w-8"></div>
                                <div>Flat No.</div>
                                <div>Owner Name</div>
                                <div>Owner Phone</div>
                                <div>Renter Name & Phone</div>
                              </div>
                              <div className="space-y-2 p-2">
                                {isLoadingFlats ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#8c52ff]" />
                                  </div>
                                ) : filteredFlats.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No flats found
                                  </p>
                                ) : (
                                  filteredFlats.map((flat) => {
                                    const isSelected = selectedFlats.some(sf => sf.flatId === flat.id);
                                    return (
                                      <div
                                        key={flat.id}
                                        className={cn(
                                          "grid grid-cols-5 gap-3 items-center p-3 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                                          isSelected && "bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700"
                                        )}
                                        onClick={() => toggleFlatSelection(flat, !isSelected)}
                                      >
                                        <div onClick={(e) => e.stopPropagation()}>
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => toggleFlatSelection(flat, checked as boolean)}
                                          />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-gray-100">{flat.flat_number}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-700 dark:text-gray-300">{flat.owner_name}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-700 dark:text-gray-300">{flat.phone_number}</p>
                                        </div>
                                        <div>
                                          {flat.residency_type === 'rented' && flat.current_renter_name ? (
                                            <div>
                                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{flat.current_renter_name}</p>
                                              <p className="text-xs text-muted-foreground">{flat.current_renter_phone}</p>
                                            </div>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="helperWork">Helper Work *</Label>
                    <Input
                      id="helperWork"
                      value={formData.helperWork}
                      onChange={(e) => handleInputChange('helperWork', e.target.value)}
                      placeholder="Enter helper work details"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

              {/* Society Helper Type Fields */}
              {formData.helperType === 'Society' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wing">Wing *</Label>
                      <Input
                        id="wing"
                        value={formData.wing}
                        onChange={(e) => handleInputChange('wing', e.target.value)}
                        placeholder="Enter wing"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secretary">Secretary *</Label>
                      <Input
                        id="secretary"
                        value={formData.secretary}
                        onChange={(e) => handleInputChange('secretary', e.target.value)}
                        placeholder="Enter secretary name"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="helperWork">Helper Work *</Label>
                    <Input
                      id="helperWork"
                      value={formData.helperWork}
                      onChange={(e) => handleInputChange('helperWork', e.target.value)}
                      placeholder="Enter helper work details"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/helpers')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Helper'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
