import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, HandHeart, Phone, Loader2, Building2, User, UserCheck, Home, Users, Edit } from 'lucide-react';
import { isAdminOrReceptionist } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Helper {
  id: string;
  name: string;
  phone: string | null;
  helper_type: string | null;
  helper_work: string | null;
  gender: string | null;
  photo_url: string | null;
  rooms: string[] | null;
  flat_details: any[] | null;
  wing: string | null;
  secretary: string | null;
  notes: string | null;
  created_at: string;
}

interface FlatDetail {
  flat_number: string;
  owner_name: string;
  owner_phone: string;
  renter_name: string | null;
  renter_phone: string | null;
  residency_type: string;
}

export default function HelperDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [helper, setHelper] = useState<Helper | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHelper();
    }
  }, [id]);

  const fetchHelper = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('helpers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setHelper(data);
    } catch (error: any) {
      console.error('Error fetching helper:', error);
      toast.error('Failed to fetch helper details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!helper) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Helper not found</p>
          <Button onClick={() => navigate('/helpers')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Helpers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const flatDetails: FlatDetail[] = helper.flat_details || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/helpers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Helpers
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{helper.name}</h1>
              <p className="text-muted-foreground">Helper details and assignments</p>
            </div>
          </div>
          {isAdminOrReceptionist() && (
            <Button
              onClick={() => navigate(`/helpers/${id}/edit`)}
              className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Helper
            </Button>
          )}
        </div>

        <div className="grid gap-6">
          {/* Helper Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5" />
                Helper Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={helper.photo_url || undefined} alt={helper.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#8c52ff] to-purple-600 text-white font-semibold">
                    {helper.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-base">{helper.name}</div>
                  {helper.helper_work && (
                    <div className="text-sm text-muted-foreground">{helper.helper_work}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <div className="text-sm">{helper.phone || '-'}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium px-2 py-0.5 text-xs",
                        helper.gender?.toLowerCase() === 'male' || helper.gender?.toLowerCase() === 'man'
                          ? "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                          : helper.gender?.toLowerCase() === 'female' || helper.gender?.toLowerCase() === 'woman'
                          ? "border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20"
                          : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
                      )}
                    >
                      {helper.gender || '-'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Helper Type</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 font-medium px-2 py-0.5 text-xs"
                    >
                      {helper.helper_type || '-'}
                    </Badge>
                  </div>
                </div>

                {helper.helper_work && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Helper Work</Label>
                    <div className="text-sm mt-1">{helper.helper_work}</div>
                  </div>
                )}

                {helper.helper_type === 'Society' && (
                  <>
                    {helper.wing && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Wing</Label>
                        <div className="text-sm mt-1">{helper.wing}</div>
                      </div>
                    )}
                    {helper.secretary && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Secretary</Label>
                        <div className="text-sm mt-1">{helper.secretary}</div>
                      </div>
                    )}
                  </>
                )}

                {helper.notes && (
                  <div className="md:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                    <div className="text-sm mt-1">{helper.notes}</div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Created At</Label>
                  <div className="text-sm mt-1">
                    {new Date(helper.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flat Details Table (for Home type helpers) */}
        {helper.helper_type === 'Home' && flatDetails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Flat Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat No.</TableHead>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Owner Phone</TableHead>
                    <TableHead>Residency Type</TableHead>
                    <TableHead>Renter Name</TableHead>
                    <TableHead>Renter Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatDetails.map((flat, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{flat.flat_number}</TableCell>
                      <TableCell>{flat.owner_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {flat.owner_phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            flat.residency_type === 'rented'
                              ? "border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20"
                              : "border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20"
                          )}
                        >
                          {flat.residency_type === 'rented' ? 'Rented' : 'Owner Living'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {flat.residency_type === 'rented' && flat.renter_name ? (
                          flat.renter_name
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {flat.residency_type === 'rented' && flat.renter_phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {flat.renter_phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Rooms/Flats List (if no flat_details but has rooms) */}
        {helper.helper_type === 'Home' && flatDetails.length === 0 && helper.rooms && helper.rooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Assigned Flats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {helper.rooms.map((room, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm px-3 py-1 border-gray-300 dark:border-gray-700">
                    {room}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

