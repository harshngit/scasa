import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, AlertCircle, Info, Megaphone, Wrench, Loader2, Edit, Archive, Search, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { isAdminOrReceptionist } from '@/lib/auth';
import { sendNoticeToAllResidents } from '@/lib/email-service';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'general' | 'maintenance' | 'event' | 'emergency'>('all');
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

      // Send email notifications to all residents
      toast.loading('Sending email notifications to residents...', { id: 'email-notification' });
      const emailResult = await sendNoticeToAllResidents({
        title: formData.title.trim(),
        content: formData.content.trim(),
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        priority: formData.priority,
        category: formData.category,
        author: user?.name || 'Admin User'
      });

      toast.dismiss('email-notification');
      if (emailResult.success > 0) {
        toast.success(`Email notifications sent to ${emailResult.success} resident(s)`);
      }
      if (emailResult.failed > 0) {
        toast.warning(`Failed to send ${emailResult.failed} email(s)`);
      }
      if (emailResult.success === 0 && emailResult.failed === 0) {
        toast.info('No residents with email addresses found');
      }
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

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || notice.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || notice.category === filterCategory;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const totalNotices = notices.length;
  const highPriorityNotices = notices.filter(n => n.priority === 'high').length;
  const emergencyNotices = notices.filter(n => n.category === 'emergency').length;
  const recentNotices = notices.filter(n => {
    const noticeDate = new Date(n.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return noticeDate >= weekAgo;
  }).length;

  // Simple count-up animation when value changes
  function CountUpNumber({ value, className }: { value: number; className?: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(value);

    useEffect(() => {
      const start = prevValue.current;
      const end = value;
      const duration = 600;
      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        setDisplayValue(current);
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
      prevValue.current = end;
    }, [value]);

    return <span className={className}>{displayValue}</span>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 group">
          {/* Animated background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex items-center justify-between">
            {/* Left Side - Content */}
            <div className="flex-1 animate-fade-in">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-gradient">
                Notice Board
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Society announcements and important notices
              </p>
            </div>

            {/* Right Side - Button */}
            {isAdminOrReceptionist() && (
              <div className="ml-6 flex gap-3 animate-slide-in-right">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => resetForm()}
                      variant="outline"
                      className="border-gray-200 hover:border-[#8c52ff] hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md px-5 py-6 h-auto"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Create Notice</span>
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
                        <Button type="submit" className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white">Publish Notice</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Total Notices',
              value: totalNotices,
              subtitle: 'All notices',
              icon: Megaphone,
              gradient: 'from-[#8c52ff] to-purple-600',
              bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
              iconBg: 'bg-[#8c52ff]/10',
              iconColor: 'text-[#8c52ff]',
            },
            {
              title: 'High Priority',
              value: highPriorityNotices,
              subtitle: 'Urgent notices',
              icon: AlertCircle,
              gradient: 'from-red-500 to-rose-600',
              bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
              iconBg: 'bg-red-500/10',
              iconColor: 'text-red-600 dark:text-red-400',
            },
            {
              title: 'Emergency',
              value: emergencyNotices,
              subtitle: 'Critical alerts',
              icon: AlertCircle,
              gradient: 'from-orange-500 to-amber-600',
              bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
              iconBg: 'bg-orange-500/10',
              iconColor: 'text-orange-600 dark:text-orange-400',
            },
            {
              title: 'Recent (7 days)',
              value: recentNotices,
              subtitle: 'This week',
              icon: Calendar,
              gradient: 'from-blue-500 to-cyan-600',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              iconBg: 'bg-blue-500/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
              >
                {/* Animated gradient background */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  card.bgGradient
                )} />

                {/* Left accent bar with gradient */}
                <div className={cn(
                  'absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b transition-all duration-500 group-hover:w-2',
                  card.gradient
                )} />

                {/* Decorative corner element */}
                <div className={cn(
                  'absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500',
                  card.gradient
                )} />

                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {card.title}
                  </CardTitle>
                  <div className={cn(
                    'p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6',
                    card.iconBg
                  )}>
                    <Icon className={cn('h-5 w-5', card.iconColor)} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <div className={cn(
                      'text-3xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
                      card.gradient
                    )}>
                      <CountUpNumber value={card.value} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-[#8c52ff] transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search notices by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                />
              </div>
              <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                <SelectTrigger className="w-full sm:w-[150px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
                <SelectTrigger className="w-full sm:w-[150px] h-12 border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notices List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
              <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
            </div>
            <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading notices...</span>
          </div>
        ) : filteredNotices.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Megaphone className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No notices found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    {searchTerm || filterPriority !== 'all' || filterCategory !== 'all'
                      ? 'Try adjusting your filters.'
                      : 'Get started by creating your first notice.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => {
              const CategoryIcon = getCategoryIcon(notice.category);
              return (
                <Card key={notice.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                  {/* Left accent bar */}
                  <div className={cn(
                    'absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b transition-all duration-500 group-hover:w-2',
                    notice.priority === 'high' ? 'from-red-500 to-rose-600' :
                    notice.priority === 'medium' ? 'from-yellow-500 to-amber-600' :
                    'from-blue-500 to-cyan-600'
                  )} />

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={cn(
                          'p-3 rounded-xl transition-all duration-300 group-hover:scale-110',
                          notice.category === 'emergency' ? 'bg-red-100 dark:bg-red-950/20' :
                          notice.category === 'maintenance' ? 'bg-blue-100 dark:bg-blue-950/20' :
                          notice.category === 'event' ? 'bg-green-100 dark:bg-green-950/20' :
                          'bg-purple-100 dark:bg-purple-950/20'
                        )}>
                          <CategoryIcon className={cn(
                            'h-6 w-6 transition-colors',
                            notice.category === 'emergency' ? 'text-red-600 dark:text-red-400' :
                            notice.category === 'maintenance' ? 'text-blue-600 dark:text-blue-400' :
                            notice.category === 'event' ? 'text-green-600 dark:text-green-400' :
                            'text-purple-600 dark:text-purple-400'
                          )} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold mb-2">{notice.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getPriorityColor(notice.priority)} className="font-semibold">
                              {notice.priority} priority
                            </Badge>
                            <Badge variant="outline" className="font-medium">
                              {notice.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(notice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{notice.author}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">{notice.content}</p>
                    {isAdminOrReceptionist() && (
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(notice)}
                          className="hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(notice.id)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
                <Button type="submit" className="bg-[#8c52ff] hover:bg-[#7a45e6] text-white">Update Notice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
