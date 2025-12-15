import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Wrench,
  DollarSign,
  Loader2,
  Building2,
  CreditCard,
  FileText,
  Settings,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const currentUser = getCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    pendingMaintenance: 0,
    pendingBills: 0,
    totalVendors: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch pending maintenance requests
      const { count: maintenanceCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch pending maintenance payments
      const { data: paymentsData } = await supabase
        .from('maintenance_payments')
        .select('status, due_date')
        .in('status', ['unpaid', 'overdue', 'partial']);

      const pendingBills = paymentsData?.filter(p => p.status === 'unpaid' || p.status === 'partial').length || 0;

      // Fetch total vendors
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      setDashboardStats({
        pendingMaintenance: maintenanceCount || 0,
        pendingBills: pendingBills,
        totalVendors: vendorsCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple count-up animation when value changes
  function CountUpNumber({ value, className }: { value: number; className?: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(value);

    useEffect(() => {
      const start = prevValue.current;
      const end = value;
      const duration = 1000; // ms
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

  // Fade-in animation component
  function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <div
        className={cn(
          'transition-all duration-700 ease-out',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          className
        )}
      >
        {children}
      </div>
    );
  }

  // Animated floating particles component
  function FloatingParticles() {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-[#8c52ff]/20 to-purple-600/20 blur-xl"
            style={{
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Animated SVG Wave component
  function AnimatedWave({ className }: { className?: string }) {
    return (
      <svg
        className={className}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 C300,20 600,100 900,60 C1050,40 1150,50 1200,60 L1200,120 L0,120 Z"
          fill="url(#waveGradient)"
          opacity="0.3"
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
    );
  }

  // Decorative geometric shapes
  function GeometricShapes() {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated circles */}
        <div className="absolute top-10 right-20 w-32 h-32 border-2 border-[#8c52ff]/20 rounded-full animate-pulse" />
        <div className="absolute bottom-20 left-10 w-24 h-24 border-2 border-purple-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border-2 border-pink-500/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Animated triangles */}
        <svg className="absolute top-1/4 right-1/4 w-16 h-16 text-[#8c52ff]/10 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
        <svg className="absolute bottom-1/3 left-1/4 w-12 h-12 text-purple-500/10 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor" style={{ animationDirection: 'reverse' }}>
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
        
        {/* Animated squares */}
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 border-2 border-purple-500/20 rotate-45 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/2 w-8 h-8 border-2 border-[#8c52ff]/20 rotate-45 animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Animated hexagons */}
        <svg className="absolute top-20 left-1/4 w-20 h-20 text-[#8c52ff]/10 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
          <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
        </svg>
        
        {/* Animated stars */}
        <svg className="absolute bottom-32 right-1/4 w-14 h-14 text-purple-500/10 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: '3s' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    );
  }

  // Animated gradient orb
  function GradientOrb({ className }: { className?: string }) {
    return (
      <div className={cn("absolute rounded-full blur-3xl opacity-30 animate-pulse", className)}>
        <div className="w-full h-full bg-gradient-to-br from-[#8c52ff] via-purple-500 to-pink-500 rounded-full" />
      </div>
    );
  }

  // Animated dashboard illustration
  function DashboardIllustration() {
    return (
      <div className="absolute right-0 top-0 w-64 h-64 opacity-10 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Animated grid lines */}
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8c52ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Grid pattern */}
          <g stroke="url(#gridGradient)" strokeWidth="0.5" fill="none">
            {[...Array(10)].map((_, i) => (
              <g key={i}>
                <line x1={i * 20} y1="0" x2={i * 20} y2="200">
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
                </line>
                <line x1="0" y1={i * 20} x2="200" y2={i * 20}>
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
                </line>
              </g>
            ))}
          </g>
          
          {/* Animated circles */}
          <circle cx="50" cy="50" r="15" fill="none" stroke="#8c52ff" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="15;20;15" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="150" cy="80" r="12" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="12;18;12" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="100" cy="150" r="10" fill="none" stroke="#ec4899" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>
        </svg>
      </div>
    );
  }

  // Society/Housing Community Vector Illustration
  function SocietyIllustration() {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <svg 
          viewBox="0 0 400 300" 
          className="w-full h-full max-w-md"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8c52ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Ground/Base */}
          <rect x="0" y="280" width="400" height="20" fill="#10b981" opacity="0.3" />
          
          {/* Building 1 (Left) */}
          <g>
            <rect x="40" y="120" width="80" height="160" fill="url(#buildingGradient)" stroke="#8c52ff" strokeWidth="2" rx="4">
              <animate attributeName="y" values="120;115;120" dur="4s" repeatCount="indefinite" />
            </rect>
            {/* Windows Building 1 */}
            <rect x="55" y="140" width="15" height="20" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </rect>
            <rect x="90" y="140" width="15" height="20" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </rect>
            <rect x="55" y="175" width="15" height="20" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1s" />
            </rect>
            <rect x="90" y="175" width="15" height="20" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.5s" />
            </rect>
            <rect x="55" y="210" width="15" height="20" fill="url(#windowGradient)" rx="2" opacity="0.3" />
            <rect x="90" y="210" width="15" height="20" fill="url(#windowGradient)" rx="2" opacity="0.3" />
            {/* Door */}
            <rect x="68" y="240" width="24" height="40" fill="#8c52ff" opacity="0.4" rx="2" />
          </g>

          {/* Building 2 (Center - Tallest) */}
          <g>
            <rect x="140" y="80" width="100" height="200" fill="url(#buildingGradient)" stroke="#8c52ff" strokeWidth="2" rx="4">
              <animate attributeName="y" values="80;75;80" dur="4s" repeatCount="indefinite" begin="0.3s" />
            </rect>
            {/* Windows Building 2 */}
            <rect x="155" y="100" width="18" height="25" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.2s" />
            </rect>
            <rect x="200" y="100" width="18" height="25" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.7s" />
            </rect>
            <rect x="155" y="140" width="18" height="25" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.2s" />
            </rect>
            <rect x="200" y="140" width="18" height="25" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.7s" />
            </rect>
            <rect x="155" y="180" width="18" height="25" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.4s" />
            </rect>
            <rect x="200" y="180" width="18" height="25" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.9s" />
            </rect>
            <rect x="155" y="220" width="18" height="25" fill="url(#windowGradient)" rx="2" opacity="0.3" />
            <rect x="200" y="220" width="18" height="25" fill="url(#windowGradient)" rx="2" opacity="0.3" />
            {/* Door */}
            <rect x="186" y="240" width="28" height="40" fill="#8c52ff" opacity="0.4" rx="2" />
          </g>

          {/* Building 3 (Right) */}
          <g>
            <rect x="260" y="140" width="90" height="140" fill="url(#buildingGradient)" stroke="#8c52ff" strokeWidth="2" rx="4">
              <animate attributeName="y" values="140;135;140" dur="4s" repeatCount="indefinite" begin="0.6s" />
            </rect>
            {/* Windows Building 3 */}
            <rect x="275" y="160" width="16" height="22" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.3s" />
            </rect>
            <rect x="310" y="160" width="16" height="22" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.8s" />
            </rect>
            <rect x="275" y="195" width="16" height="22" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.3s" />
            </rect>
            <rect x="310" y="195" width="16" height="22" fill="url(#windowGradient)" rx="2">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.8s" />
            </rect>
            <rect x="275" y="230" width="16" height="22" fill="url(#windowGradient)" rx="2" opacity="0.3" />
            <rect x="310" y="230" width="16" height="22" fill="url(#windowGradient)" rx="2" opacity="0.3" />
            {/* Door */}
            <rect x="292" y="250" width="26" height="30" fill="#8c52ff" opacity="0.4" rx="2" />
          </g>

          {/* Trees/Plants */}
          <circle cx="20" cy="270" r="15" fill="#10b981" opacity="0.4">
            <animate attributeName="r" values="15;17;15" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="360" cy="275" r="12" fill="#10b981" opacity="0.4">
            <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite" begin="1s" />
          </circle>

          {/* Sun */}
          <circle cx="320" cy="40" r="25" fill="#fbbf24" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="320" cy="40" r="20" fill="#fbbf24" opacity="0.2" />

          {/* Connection lines (representing community) */}
          <line x1="120" y1="200" x2="140" y2="180" stroke="#8c52ff" strokeWidth="2" strokeDasharray="4 4" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="240" y1="180" x2="260" y2="200" stroke="#8c52ff" strokeWidth="2" strokeDasharray="4 4" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" begin="1s" />
          </line>
        </svg>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative space-y-8 pb-8 min-h-screen">
        {/* Animated background elements */}
        <FloatingParticles />
        <GeometricShapes />
        <GradientOrb className="top-0 right-0 w-96 h-96" />
        <GradientOrb className="bottom-0 left-0 w-80 h-80" style={{ animationDelay: '1s' }} />

        {/* Header Section with Animation */}
        <FadeIn delay={0}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/30 dark:from-gray-900/80 dark:via-purple-950/50 dark:to-pink-950/30 p-8 border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8c52ff]/10 via-purple-500/5 to-pink-500/10 blur-3xl -z-10" />
            <AnimatedWave className="absolute bottom-0 left-0 w-full h-24 -z-10" />
            <DashboardIllustration />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#8c52ff] via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  Welcome back, {currentUser.name}!
                </h1>
                <Sparkles className="h-6 w-6 text-[#8c52ff] animate-pulse" />
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Here's what's happening in your society today.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Introduction and Features */}
        <FadeIn delay={100}>
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 backdrop-blur-sm group">
            {/* Animated background gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8c52ff]/20 to-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Decorative SVG elements */}
            <svg className="absolute top-4 right-4 w-32 h-32 text-[#8c52ff]/5" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5">
                <animate attributeName="r" values="40;45;40" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5">
                <animate attributeName="r" values="25;30;25" dur="3s" repeatCount="indefinite" begin="0.5s" />
              </circle>
            </svg>

            <CardContent className="pt-8 pb-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Content */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#8c52ff] to-purple-600 bg-clip-text text-transparent">
                      SCASA
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                      SCASA is a comprehensive digital solution designed to streamline and modernize the management of housing societies.
                      Our platform empowers administrators, receptionists, and residents with powerful tools to manage daily operations,
                      track finances, handle maintenance, and maintain transparent communication.
                    </p>
                  </div>
                </div>

                {/* Right Side - Society Illustration */}
                <div className="hidden lg:block relative h-full min-h-[300px]">
                  <SocietyIllustration />
                </div>
              </div>

              <div className="space-y-8 mt-8">

              <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#8c52ff]" />
                    Key Features
                  </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      { icon: Users, title: 'Resident Management', desc: 'Comprehensive resident database with flat details and contact information' },
                      { icon: CreditCard, title: 'Maintenance Payments', desc: 'Automated billing, payment tracking, and receipt generation' },
                      { icon: Wrench, title: 'Maintenance Requests', desc: 'Track and manage maintenance requests with status updates' },
                      { icon: Building2, title: 'Vendor Management', desc: 'Manage vendors, invoices, and track payment history' },
                      { icon: FileText, title: 'Invoice & Receipts', desc: 'Generate professional invoices and receipts in PDF format' },
                      { icon: Settings, title: 'Role-Based Access', desc: 'Secure access control with admin, receptionist, and resident roles' },
                    ].map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <FadeIn key={feature.title} delay={200 + idx * 50}>
                          <div className="group relative flex items-start space-x-4 p-5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-[#8c52ff]/50 hover:shadow-lg hover:shadow-[#8c52ff]/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                            {/* Animated background on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8c52ff]/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Decorative corner element */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#8c52ff]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative z-10 p-3 rounded-xl bg-gradient-to-br from-[#8c52ff]/10 to-purple-600/10 text-[#8c52ff] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-[#8c52ff]/20">
                              <Icon className="h-6 w-6 animate-pulse group-hover:animate-none" />
                    </div>
                            <div className="flex-1 relative z-10">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#8c52ff] transition-colors">
                                {feature.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {feature.desc}
                              </p>
                    </div>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-[#8c52ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 opacity-0 group-hover:opacity-100 relative z-10" />
                  </div>
                        </FadeIn>
                      );
                    })}
                    </div>
                  </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {[
                      'Real-time data synchronization',
                      'Secure cloud-based storage',
                      'Mobile-responsive design'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#8c52ff] animate-pulse" />
                        <span>{item}</span>
                    </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </FadeIn>

        {/* Dashboard Statistics */}
        {isLoading ? (
          <FadeIn delay={300}>
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-[#8c52ff]" />
                <div className="absolute inset-0 h-10 w-10 animate-ping text-[#8c52ff]/20" />
              </div>
          </div>
          </FadeIn>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Resident Pending Maintenance',
                value: dashboardStats.pendingMaintenance,
                subtitle: 'Requires attention',
                icon: Wrench,
                gradient: 'from-orange-500 to-red-500',
                bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20',
                iconBg: 'bg-orange-500/10',
                iconColor: 'text-orange-600 dark:text-orange-400',
              },
              {
                title: 'Pending Bills',
                value: dashboardStats.pendingBills,
                subtitle: 'Unpaid bills',
                icon: DollarSign,
                gradient: 'from-yellow-500 to-amber-500',
                bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
                iconBg: 'bg-yellow-500/10',
                iconColor: 'text-yellow-600 dark:text-yellow-400',
              },
              {
                title: 'Total Vendors',
                value: dashboardStats.totalVendors,
                subtitle: 'Registered vendors',
                icon: Building2,
                gradient: 'from-[#8c52ff] to-purple-600',
                bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
                iconBg: 'bg-[#8c52ff]/10',
                iconColor: 'text-[#8c52ff]',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <FadeIn key={card.title} delay={400 + idx * 100}>
                  <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                    {/* Animated gradient background */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                      card.bgGradient
                    )} />
                    
                    {/* Animated SVG pattern overlay */}
                    <svg className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <pattern id={`pattern-${idx}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="10" cy="10" r="1" fill="currentColor" className={card.iconColor}>
                            <animate attributeName="r" values="1;2;1" dur="2s" repeatCount="indefinite" />
                          </circle>
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill={`url(#pattern-${idx})`} />
                    </svg>
                    
                    {/* Left accent bar with gradient and animation */}
                    <div className={cn(
                      'absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b transition-all duration-500 group-hover:w-2',
                      card.gradient
                    )}>
                      <div className={cn(
                        'absolute inset-0 bg-gradient-to-b animate-pulse',
                        card.gradient
                      )} style={{ animationDelay: `${idx * 0.2}s` }} />
                    </div>
                    
                    {/* Decorative corner element with animation */}
                    <div className={cn(
                      'absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 animate-pulse',
                      card.gradient
                    )} style={{ animationDelay: `${idx * 0.3}s` }} />
                    
                    {/* Floating particles inside card */}
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8c52ff]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" />
                    <div className="absolute bottom-2 right-4 w-1.5 h-1.5 rounded-full bg-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" style={{ animationDelay: '0.5s' }} />

                    <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                        {card.title}
                      </CardTitle>
                      <div className={cn(
                        'relative p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6',
                        card.iconBg
                      )}>
                        <Icon className={cn('h-5 w-5 relative z-10', card.iconColor)} />
                        {/* Animated glow effect */}
                        <div className={cn(
                          'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300',
                          card.iconBg
                        )} />
                      </div>
                  </CardHeader>
                    <CardContent className="relative z-10 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <div className={cn(
                          'text-4xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent relative',
                          card.gradient
                        )}>
                      <CountUpNumber value={card.value} />
                          {/* Animated underline on hover */}
                          <div className={cn(
                            'absolute bottom-0 left-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 w-0 group-hover:w-full transition-all duration-500',
                            card.gradient
                          )} />
                        </div>
                        <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-[#8c52ff] group-hover:scale-125 transition-all duration-300" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {card.subtitle}
                      </p>
                      {/* Progress indicator bar */}
                      <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div 
                          className={cn(
                            'h-full bg-gradient-to-r rounded-full transition-all duration-1000',
                            card.gradient
                          )}
                          style={{ width: `${Math.min((card.value / 100) * 100, 100)}%` }}
                        />
                    </div>
                  </CardContent>
                </Card>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}