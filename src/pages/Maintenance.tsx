import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Wrench, Clock, CheckCircle, XCircle, User, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser, isAdminOrReceptionist } from '@/lib/auth';

interface MaintenanceRequestData {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requested_by: string;
  flat_number: string;
  date_requested: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export default function Maintenance() {
  const { user } = useAuth();
  const currentUser = getCurrentUser();
  const [requests, setRequests] = useState<MaintenanceRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'other' | '',
    priority: '' as 'low' | 'medium' | 'high' | '',
    flatNumber: ''
  });
  const [newStatus, setNewStatus] = useState<'pending' | 'in-progress' | 'completed' | 'cancelled'>('pending');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('date_requested', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance requests:', error);
        toast.error('Failed to load maintenance requests');
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load maintenance requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in-progress': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'in-progress': return Wrench;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: '',
      flatNumber: ''
    });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.priority) {
      toast.error('Please select a priority');
      return;
    }
    if (!formData.flatNumber.trim()) {
      toast.error('Please enter flat number');
      return;
    }

    try {
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        flat_number: formData.flatNumber.trim(),
        requested_by: user?.name || 'Resident',
        status: 'pending' as const
      };

      const { error } = await supabase
        .from('maintenance_requests')
        .insert([requestData]);

      if (error) {
        console.error('Error creating maintenance request:', error);
        toast.error('Failed to create maintenance request');
        return;
      }

      toast.success('Maintenance request created successfully!');
      setIsDialogOpen(false);
      resetForm();
      fetchRequests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create maintenance request');
    }
  };

  const handleUpdateStatusClick = (request: MaintenanceRequestData) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAssignedTo(request.assigned_to || '');
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    try {
      const updateData: any = {
        status: newStatus
      };

      if (assignedTo.trim()) {
        updateData.assigned_to = assignedTo.trim();
      } else {
        updateData.assigned_to = null;
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('Error updating maintenance request:', error);
        toast.error('Failed to update request status');
        return;
      }

      toast.success('Request status updated successfully!');
      setIsStatusDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update request status');
    }
  };

  const filterRequestsByStatus = (status: string) => {
    if (status === 'all') return requests;
    return requests.filter(request => request.status === status);
  };

  const RequestCard = ({ request }: { request: MaintenanceRequestData }) => {
    const StatusIcon = getStatusIcon(request.status);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                <StatusIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{request.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge variant={getPriorityColor(request.priority)}>
                    {request.priority} priority
                  </Badge>
                  <Badge variant="outline">{request.category}</Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(request.date_requested).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{request.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Requested by:</span>
              <span className="font-medium">{request.requested_by}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Flat:</span>
              <span className="font-medium">{request.flat_number}</span>
            </div>
            {request.assigned_to && (
              <div className="flex items-center space-x-2 col-span-2">
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">{request.assigned_to}</span>
              </div>
            )}
          </div>
          {isAdminOrReceptionist() && (
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatusClick(request)}
            >
              Update Status
            </Button>
          </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
            <p className="text-muted-foreground">
              Manage maintenance requests and service issues
            </p>
          </div>
          {isAdminOrReceptionist() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Maintenance Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRequest}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed description of the problem"
                      className="min-h-[100px]"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                        required
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="priority">Priority *</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange('priority', value)}
                        required
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="flat">Flat Number *</Label>
                    <Input
                      id="flat"
                      placeholder="e.g., A-101"
                      value={formData.flatNumber}
                      onChange={(e) => handleInputChange('flatNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Submit Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}

          {/* Update Status Dialog */}
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Request Status</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value: 'pending' | 'in-progress' | 'completed' | 'cancelled') => setNewStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
                  <Input
                    id="assignedTo"
                    placeholder="Enter staff name or leave empty"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleUpdateStatus}>Update Status</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading maintenance requests...</span>
          </div>
        ) : (
          <>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
                <TabsTrigger value="all">All Requests ({requests.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({filterRequestsByStatus('pending').length})</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress ({filterRequestsByStatus('in-progress').length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({filterRequestsByStatus('completed').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
                {requests.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No maintenance requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All systems are running smoothly.
            </p>
          </div>
                ) : (
                  requests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {filterRequestsByStatus('pending').length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No pending requests</h3>
                  </div>
                ) : (
                  filterRequestsByStatus('pending').map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="in-progress" className="space-y-4">
                {filterRequestsByStatus('in-progress').length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No in-progress requests</h3>
                  </div>
                ) : (
                  filterRequestsByStatus('in-progress').map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {filterRequestsByStatus('completed').length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No completed requests</h3>
                  </div>
                ) : (
                  filterRequestsByStatus('completed').map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}