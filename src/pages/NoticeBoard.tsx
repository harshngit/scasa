import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, AlertCircle, Info, Megaphone, Wrench, Loader2, Edit, Archive } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface NoticeData {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'maintenance' | 'event' | 'emergency';
  author: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: '' as 'low' | 'medium' | 'high' | '',
    category: '' as 'general' | 'maintenance' | 'event' | 'emergency' | '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_archived', false)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching notices:', error);
        toast.error('Failed to load notices');
        return;
      }

      setNotices(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load notices');
    } finally {
      setIsLoading(false);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return Wrench;
      case 'event': return Calendar;
      case 'emergency': return AlertCircle;
      case 'general': return Info;
      default: return Megaphone;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingNotice(null);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (!formData.priority) {
      toast.error('Please select priority');
      return;
    }
    if (!formData.category) {
      toast.error('Please select category');
      return;
    }

    try {
      const noticeData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        category: formData.category,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        author: user?.name || 'Admin User',
        is_archived: false
      };

      const { error } = await supabase
        .from('notices')
        .insert([noticeData]);

      if (error) {
        console.error('Error creating notice:', error);
        toast.error('Failed to create notice');
        return;
      }

      toast.success('Notice created successfully!');
      setIsDialogOpen(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create notice');
    }
  };

  const handleEditClick = (notice: NoticeData) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      category: notice.category,
      date: new Date(notice.date).toISOString().split('T')[0]
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingNotice) return;

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (!formData.priority) {
      toast.error('Please select priority');
      return;
    }
    if (!formData.category) {
      toast.error('Please select category');
      return;
    }

    try {
      const { error } = await supabase
        .from('notices')
        .update({
          title: formData.title.trim(),
          content: formData.content.trim(),
          priority: formData.priority,
          category: formData.category,
          date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
        })
        .eq('id', editingNotice.id);

      if (error) {
        console.error('Error updating notice:', error);
        toast.error('Failed to update notice');
        return;
      }

      toast.success('Notice updated successfully!');
      setIsEditDialogOpen(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update notice');
    }
  };

  const handleArchive = async (noticeId: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_archived: true })
        .eq('id', noticeId);

      if (error) {
        console.error('Error archiving notice:', error);
        toast.error('Failed to archive notice');
        return;
      }

      toast.success('Notice archived successfully');
      fetchNotices();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to archive notice');
    }
  };

  const sortedNotices = notices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
            <p className="text-muted-foreground">
              Society announcements and important notices
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Notice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateNotice}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter notice title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter notice content"
                      className="min-h-[100px]"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Publish Notice</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit Notice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateNotice}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      placeholder="Enter notice title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-content">Content *</Label>
                    <Textarea
                      id="edit-content"
                      placeholder="Enter notice content"
                      className="min-h-[100px]"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-priority">Priority *</Label>
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
                  <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                        required
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
              </div>
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Update Notice</Button>
              </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading notices...</span>
          </div>
        ) : (
        <div className="space-y-4">
          {sortedNotices.map((notice) => {
            const CategoryIcon = getCategoryIcon(notice.category);
            return (
              <Card key={notice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <CategoryIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{notice.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={getPriorityColor(notice.priority)}>
                            {notice.priority} priority
                          </Badge>
                          <Badge variant="outline">{notice.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(notice.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="h-3 w-3" />
                        <span>{notice.author}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                  <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(notice)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(notice.id)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}

        {notices.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No notices yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first notice.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}