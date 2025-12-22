import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Building2, Plus, Search, Edit, Trash2, Loader2, TrendingUp, DollarSign, Clock, CheckCircle, Phone, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DepositeOnRenovation {
    id: string;
    resident_id: string | null;
    flat_number: string;
    resident_name: string;
    owner_name: string | null;
    phone_number: string | null;
    amount: number;
    deposit_date: string;
    status: 'pending' | 'refunded' | 'forfeited';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Resident {
    id: string;
    flat_number: string;
    owner_name: string;
    phone_number: string;
}

export default function DepositeOnRenovation() {
    const navigate = useNavigate();
    const [deposits, setDeposits] = useState<DepositeOnRenovation[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingResidents, setLoadingResidents] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDepositId, setDeleteDepositId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        resident_id: '',
        flat_number: '',
        owner_name: '',
        phone_number: '',
        amount: '',
        deposit_date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pending' as 'pending' | 'refunded' | 'forfeited'
    });

    useEffect(() => {
        fetchDeposits();
        fetchResidents();
    }, []);

    const fetchResidents = async () => {
        try {
            setLoadingResidents(true);
            const { data, error } = await supabase
                .from('residents')
                .select('id, flat_number, owner_name, phone_number')
                .order('flat_number', { ascending: true });

            if (error) throw error;
            setResidents(data || []);
        } catch (error: any) {
            console.error('Error fetching residents:', error);
            toast.error('Failed to fetch residents');
        } finally {
            setLoadingResidents(false);
        }
    };

    const fetchDeposits = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('deposite_on_renovation')
                .select(`
          *,
          residents:resident_id (
            id,
            owner_name,
            flat_number
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data?.map((item: any) => ({
                id: item.id,
                resident_id: item.resident_id,
                flat_number: item.residents?.flat_number || item.flat_number || 'N/A',
                resident_name: item.residents?.owner_name || item.owner_name || 'N/A',
                owner_name: item.owner_name || item.residents?.owner_name || null,
                phone_number: item.phone_number || item.residents?.phone_number || null,
                amount: item.amount,
                deposit_date: item.deposit_date,
                status: item.status,
                notes: item.notes,
                created_at: item.created_at,
                updated_at: item.updated_at
            })) || [];

            setDeposits(formattedData);
        } catch (error: any) {
            console.error('Error fetching deposits:', error);
            toast.error('Failed to fetch deposits');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update existing deposit
                const { error } = await supabase
                    .from('deposite_on_renovation')
                    .update({
                        resident_id: formData.resident_id || null,
                        flat_number: formData.flat_number,
                        owner_name: formData.owner_name || null,
                        phone_number: formData.phone_number || null,
                        amount: parseFloat(formData.amount),
                        deposit_date: formData.deposit_date,
                        status: formData.status,
                        notes: formData.notes || null
                    })
                    .eq('id', editingId);

                if (error) throw error;
                toast.success('Deposit updated successfully');
            } else {
                // Create new deposit
                const { error } = await supabase
                    .from('deposite_on_renovation')
                    .insert([{
                        resident_id: formData.resident_id || null,
                        flat_number: formData.flat_number,
                        owner_name: formData.owner_name || null,
                        phone_number: formData.phone_number || null,
                        amount: parseFloat(formData.amount),
                        deposit_date: formData.deposit_date,
                        status: formData.status,
                        notes: formData.notes || null
                    }]);

                if (error) throw error;
                toast.success('Deposit added successfully');
            }

            setIsDialogOpen(false);
            setEditingId(null);
            setFormData({
                resident_id: '',
                flat_number: '',
                owner_name: '',
                phone_number: '',
                amount: '',
                deposit_date: new Date().toISOString().split('T')[0],
                notes: '',
                status: 'pending'
            });
            fetchDeposits();
        } catch (error: any) {
            console.error('Error saving deposit:', error);
            toast.error(editingId ? 'Failed to update deposit' : 'Failed to add deposit');
        }
    };

    const handleEdit = (deposit: DepositeOnRenovation) => {
        setEditingId(deposit.id);
        setFormData({
            resident_id: deposit.resident_id || '',
            flat_number: deposit.flat_number,
            owner_name: deposit.owner_name || '',
            phone_number: deposit.phone_number || '',
            amount: deposit.amount.toString(),
            deposit_date: deposit.deposit_date,
            notes: deposit.notes || '',
            status: deposit.status
        });
        setIsDialogOpen(true);
    };

    const handleFlatNumberChange = (flatNumber: string) => {
        const resident = residents.find(r => r.flat_number === flatNumber);
        if (resident) {
            setFormData({
                ...formData,
                resident_id: resident.id,
                flat_number: resident.flat_number,
                owner_name: resident.owner_name,
                phone_number: resident.phone_number
            });
        } else {
            setFormData({
                ...formData,
                resident_id: '',
                flat_number: flatNumber,
                owner_name: '',
                phone_number: ''
            });
        }
    };

    const handleDelete = async (depositId: string) => {
        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('deposite_on_renovation')
                .delete()
                .eq('id', depositId);

            if (error) throw error;

            toast.success('Deposit deleted successfully');
            fetchDeposits();
            setDeleteDepositId(null);
        } catch (error: any) {
            console.error('Error deleting deposit:', error);
            toast.error('Failed to delete deposit');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({
            resident_id: '',
            flat_number: '',
            owner_name: '',
            phone_number: '',
            amount: '',
            deposit_date: new Date().toISOString().split('T')[0],
            notes: '',
            status: 'pending'
        });
    };

    const filteredDeposits = deposits.filter(deposit =>
        deposit.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.resident_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalDeposits = filteredDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const pendingDeposits = filteredDeposits.filter(d => d.status === 'pending').length;
    const refundedDeposits = filteredDeposits.filter(d => d.status === 'refunded').length;
    const forfeitedDeposits = filteredDeposits.filter(d => d.status === 'forfeited').length;

    // Simple count-up animation when value changes
    function CountUpNumber({ value, className }: { value: number; className?: string }) {
        const [displayValue, setDisplayValue] = useState(0);
        const prevValue = useRef(value);

        useEffect(() => {
            const start = prevValue.current;
            const end = value;
            const duration = 600; // ms
            const startTime = performance.now();

            const step = (now: number) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out
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
                                Deposite on Renovation
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                Manage renovation deposits from residents
                            </p>
                        </div>

                        {/* Right Side - Button */}
                        <div className="ml-6 flex gap-3 animate-slide-in-right">
                            <Button
                                onClick={() => navigate('/expenses/deposite-on-renovation/create')}
                                className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30 transition-all duration-300 hover:scale-105 active:scale-95 px-6 py-6 h-auto"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                <span className="font-semibold">Add Deposit</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            title: 'Total Deposits',
                            value: totalDeposits,
                            subtitle: `${filteredDeposits.length} records`,
                            icon: DollarSign,
                            gradient: 'from-[#8c52ff] to-purple-600',
                            bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
                            iconBg: 'bg-[#8c52ff]/10',
                            iconColor: 'text-[#8c52ff]',
                            format: 'currency',
                        },
                        {
                            title: 'Pending',
                            value: pendingDeposits,
                            subtitle: 'Awaiting refund',
                            icon: Clock,
                            gradient: 'from-yellow-500 to-orange-600',
                            bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
                            iconBg: 'bg-yellow-500/10',
                            iconColor: 'text-yellow-600 dark:text-yellow-400',
                            format: 'number',
                        },
                        {
                            title: 'Refunded',
                            value: refundedDeposits,
                            subtitle: 'Completed refunds',
                            icon: CheckCircle,
                            gradient: 'from-green-500 to-emerald-600',
                            bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
                            iconBg: 'bg-green-500/10',
                            iconColor: 'text-green-600 dark:text-green-400',
                            format: 'number',
                        },
                        {
                            title: 'Forfeited',
                            value: forfeitedDeposits,
                            subtitle: 'Forfeited deposits',
                            icon: Building2,
                            gradient: 'from-red-500 to-rose-600',
                            bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
                            iconBg: 'bg-red-500/10',
                            iconColor: 'text-red-600 dark:text-red-400',
                            format: 'number',
                        },
                    ].map((card, idx) => {
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
                                            {card.format === 'currency' ? (
                                                <>₹<CountUpNumber value={card.value} /></>
                                            ) : (
                                                <CountUpNumber value={card.value} />
                                            )}
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

                {/* Search */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by flat number or resident name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 text-base border-gray-200 focus:border-[#8c52ff] focus:ring-[#8c52ff]/20"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Deposits Table */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="relative">
                                    <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                                    <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
                                </div>
                                <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading deposits...</span>
                            </div>
                        ) : filteredDeposits.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="flex flex-col items-center">
                                    <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                        <Building2 className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No deposits found</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new deposit.'}
                                    </p>
                                    {!searchTerm && (
                                        <Button
                                            onClick={() => navigate('/expenses/deposite-on-renovation/create')}
                                            className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white shadow-lg shadow-[#8c52ff]/30"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Deposit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-800">
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Flat Number</TableHead>
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Owner Name</TableHead>
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Phone Number</TableHead>
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Amount</TableHead>
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Deposit Date</TableHead>
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Status</TableHead>
                                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 py-4">Notes</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDeposits.map((deposit, idx) => (
                                            <TableRow
                                                key={deposit.id}
                                                className={cn(
                                                    "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200",
                                                    "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20",
                                                    idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                                                )}
                                            >
                                                <TableCell className="py-4">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{deposit.flat_number}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-gray-700 dark:text-gray-300">{deposit.owner_name || deposit.resident_name || '-'}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {deposit.phone_number ? (
                                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                            <span>{deposit.phone_number}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">₹{deposit.amount.toLocaleString()}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-gray-700 dark:text-gray-300">{new Date(deposit.deposit_date).toLocaleDateString()}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-xs font-medium",
                                                        deposit.status === 'pending'
                                                            ? "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800"
                                                            : deposit.status === 'refunded'
                                                                ? "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-800"
                                                                : "bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800"
                                                    )}>
                                                        {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate block">
                                                        {deposit.notes || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/expenses/deposite-on-renovation/${deposit.id}`)}
                                                            title="View Deposit"
                                                            className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/expenses/deposite-on-renovation/${deposit.id}/edit`)}
                                                            title="Edit Deposit"
                                                            className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setDeleteDepositId(deposit.id)}
                                                                    disabled={isDeleting}
                                                                    title="Delete Deposit"
                                                                    className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete the deposit
                                                                        for <strong>{deposit.flat_number}</strong> (₹{deposit.amount.toLocaleString()}).
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel onClick={() => setDeleteDepositId(null)}>
                                                                        Cancel
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(deposit.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        {isDeleting ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Deleting...
                                                                            </>
                                                                        ) : (
                                                                            'Delete'
                                                                        )}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add/Edit Deposit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Deposit' : 'Add New Deposit'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'Update the deposit details below.' : 'Enter the details for the new renovation deposit.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="flat_number">Flat Number</Label>
                                <Select
                                    value={formData.flat_number}
                                    onValueChange={handleFlatNumberChange}
                                    disabled={loadingResidents}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingResidents ? "Loading residents..." : "Select flat number"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {residents.map((resident) => (
                                            <SelectItem key={resident.id} value={resident.flat_number}>
                                                {resident.flat_number} - {resident.owner_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="owner_name">Owner Name</Label>
                                <Input
                                    id="owner_name"
                                    value={formData.owner_name}
                                    readOnly
                                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                    placeholder="Auto-filled from flat selection"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone_number">Phone Number</Label>
                                <Input
                                    id="phone_number"
                                    value={formData.phone_number}
                                    readOnly
                                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                    placeholder="Auto-filled from flat selection"
                                />
                            </div>
                            <div>
                                <Label htmlFor="amount">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="deposit_date">Deposit Date</Label>
                                <Input
                                    id="deposit_date"
                                    type="date"
                                    value={formData.deposit_date}
                                    onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="refunded">Refunded</SelectItem>
                                        <SelectItem value="forfeited">Forfeited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleDialogClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-gradient-to-r from-[#8c52ff] to-purple-600 hover:from-[#9d62ff] hover:to-purple-700 text-white">
                                    {editingId ? 'Update Deposit' : 'Add Deposit'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

