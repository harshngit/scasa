import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Phone, Mail, Calendar, Users, FileText, Download, Loader2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  residents_living: any[];
  documents: any[];
  created_at: string;
  updated_at: string;
}

export default function ResidentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        return;
      }

      setResident(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load resident details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resident) return;

    try {
      const { error } = await supabase
        .from('residents')
        .delete()
        .eq('id', resident.id);

      if (error) {
        console.error('Error deleting resident:', error);
        toast.error('Failed to delete resident');
        return;
      }

      toast.success('Resident deleted successfully');
      setDeleteDialogOpen(false);
      navigate('/residents');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete resident');
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

  if (!resident) {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/residents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Residents
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Resident Details</h1>
              <p className="text-muted-foreground">
                Complete information for {resident.owner_name}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button onClick={() => navigate(`/residents/${resident.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl">
                  {resident.owner_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{resident.owner_name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{resident.flat_number}</Badge>
                      <Badge variant={resident.residency_type === 'owner-living' ? 'default' : 'secondary'}>
                        {resident.residency_type === 'owner-living' ? 'Owner Living' : 'Rented'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{resident.phone_number}</span>
                    </div>
                    {resident.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{resident.email}</span>
                    </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{resident.residents_living?.length || 0} resident(s) living</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Registered: {new Date(resident.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Information - Only show if rented */}
        {resident.residency_type === 'rented' && (
          <Card>
            <CardHeader>
              <CardTitle>Rental Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Current Renter</h4>
                  <div className="space-y-2">
                    {resident.current_renter_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{resident.current_renter_name}</span>
                    </div>
                    )}
                    {resident.current_renter_phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{resident.current_renter_phone}</span>
                    </div>
                    )}
                    {resident.current_renter_email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{resident.current_renter_email}</span>
                    </div>
                    )}
                  </div>
                  {resident.old_renter_name && (
                    <>
                      <Separator />
                      <h4 className="font-medium">Previous Renter</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{resident.old_renter_name}</span>
                        </div>
                        {resident.old_renter_phone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{resident.old_renter_phone}</span>
                          </div>
                        )}
                        {resident.old_renter_email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{resident.old_renter_email}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Rental Details</h4>
                  <div className="space-y-2">
                    {resident.monthly_rent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent:</span>
                        <span className="font-medium">₹{resident.monthly_rent.toLocaleString()}</span>
                    </div>
                    )}
                    {resident.rent_start_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-medium">{new Date(resident.rent_start_date).toLocaleDateString()}</span>
                    </div>
                    )}
                    {resident.rent_end_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span className="font-medium">{new Date(resident.rent_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {resident.rent_agreement_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rent Agreement:</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={resident.rent_agreement_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Residents Living in Flat */}
        <Card>
          <CardHeader>
            <CardTitle>Residents Living in Flat</CardTitle>
          </CardHeader>
          <CardContent>
            {resident.residents_living && resident.residents_living.length > 0 ? (
            <div className="space-y-3">
                {resident.residents_living.map((residentLiving: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                          {residentLiving.name?.split(' ').map((n: string) => n[0]).join('') || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{residentLiving.name}</div>
                        <div className="text-sm text-muted-foreground">{residentLiving.phoneNumber || residentLiving.phone}</div>
                        {residentLiving.email && (
                          <div className="text-sm text-muted-foreground">{residentLiving.email}</div>
                        )}
                        {residentLiving.isRenter && (
                          <Badge variant="secondary" className="mt-1">Current Renter</Badge>
                        )}
                      </div>
                    </div>
                    {residentLiving.dateJoined && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Joined</div>
                        <div className="font-medium">{new Date(residentLiving.dateJoined).toLocaleDateString()}</div>
                  </div>
                    )}
                </div>
              ))}
            </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No residents listed</p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {resident.documents && resident.documents.length > 0 ? (
            <div className="grid gap-3">
                {resident.documents.map((document: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{document.name}</div>
                      <div className="text-sm text-muted-foreground">{document.type}</div>
                    </div>
                  </div>
                    {document.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                        </a>
                    </Button>
                    )}
                </div>
              ))}
            </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/residents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Residents
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Resident
          </Button>
          <Button onClick={() => navigate(`/residents/${resident.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Resident
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the resident
                <strong> {resident?.owner_name}</strong> (Flat: {resident?.flat_number}) and all
                associated data including documents, rental information, and resident records from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Resident
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}