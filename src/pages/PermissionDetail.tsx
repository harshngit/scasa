import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileCheck, Phone, Mail, Building2, Calendar, Loader2, Edit } from 'lucide-react';
import { isAdminOrReceptionist } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Permission {
  id: string;
  resident_name: string;
  phone_number: string | null;
  email: string | null;
  flat_number: string | null;
  wing: string | null;
  permission_text: string | null;
  permission_date: string;
  created_at: string;
}

export default function PermissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPermission();
    }
  }, [id]);

  const fetchPermission = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPermission(data);
    } catch (error: any) {
      console.error('Error fetching permission:', error);
      toast.error('Failed to fetch permission details');
      navigate('/permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

  if (!permission) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Permission not found</h3>
          <Button onClick={() => navigate('/permissions')} className="mt-4">
            Back to Permissions
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/permissions')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Permissions
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Permission Details
                </h1>
                <p className="text-muted-foreground">
                  View complete permission information
                </p>
              </div>
            </div>
            {isAdminOrReceptionist() && (
              <Button 
                onClick={() => navigate(`/permissions/${permission.id}/edit`)}
                className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Permission
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resident Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-[#8c52ff]" />
                <span>Resident Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Resident Name</Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{permission.resident_name}</p>
              </div>

              {permission.phone_number && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <p className="text-base text-gray-900 dark:text-gray-100">{permission.phone_number}</p>
                </div>
              )}

              {permission.email && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-base text-gray-900 dark:text-gray-100">{permission.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flat & Date Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-[#8c52ff]" />
                <span>Flat & Date Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Flat Number</Label>
                <div className="flex flex-wrap gap-2">
                  {permission.flat_number && (
                    <Badge variant="outline" className="text-sm border-gray-300 dark:border-gray-700 px-3 py-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {permission.flat_number}
                    </Badge>
                  )}
                  {permission.wing && (
                    <Badge variant="outline" className="text-sm border-gray-300 dark:border-gray-700 px-3 py-1">
                      Wing: {permission.wing}
                    </Badge>
                  )}
                  {!permission.flat_number && !permission.wing && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Permission Date
                </Label>
                <p className="text-base text-gray-900 dark:text-gray-100">{formatDate(permission.permission_date)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(permission.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permission Text */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-[#8c52ff]" />
              <span>Permission Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Permission Text</Label>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {permission.permission_text || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

