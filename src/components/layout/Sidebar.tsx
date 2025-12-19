import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  Shield,
  Car,
  Camera,
  CreditCard,
  Building2,
  UserCog,
  LogOut,
  HandHeart,
  UserPlus,
  Megaphone,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

const navigation: Array<{
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  adminOnly?: boolean;
}> = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, permission: 'dashboard' },
    { name: 'Residents', href: '/residents', icon: Users, permission: 'residents' },
    { name: 'Maintenance Payments', href: '/maintenance-payments', icon: CreditCard, permission: 'maintenance_payments' },
    { name: 'Notice Board', href: '/notices', icon: Megaphone, permission: 'notices' },
    { name: 'Complaints', href: '/complaints', icon: AlertCircle, permission: 'notices' },
    { name: 'Permissions', href: '/permissions', icon: FileCheck, permission: 'notices' },
    // Commented out - to be implemented later
    // { name: 'Amenities', href: '/amenities', icon: Calendar, permission: 'amenities' },
    // { name: 'Finance', href: '/finance', icon: DollarSign, permission: 'finance' },
    // { name: 'Visitors', href: '/visitors', icon: UserCheck, permission: 'visitors' },
    // { name: 'Security', href: '/security', icon: Shield, permission: 'security' },
    // { name: 'Advanced Security', href: '/security-advanced', icon: Camera, permission: 'security' },
    // { name: 'Parking', href: '/parking', icon: Car, permission: 'parking' },
    { name: 'Vendors', href: '/vendors', icon: Building2, permission: 'vendors' },
    { name: 'Helpers', href: '/helpers', icon: HandHeart, permission: 'users' },
    // { name: 'Add Helper', href: '/helpers/create', icon: UserPlus, permission: 'users' },
    { name: 'Users', href: '/users', icon: UserCog, permission: 'users', adminOnly: true },
  ];

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { logout } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    // Check if item is admin-only
    if (item.adminOnly && currentUser.role !== 'admin') {
      return false;
    }
    return hasPermission(item.permission, 'read');
  });

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-white border-r border-gray-200/50 flex-shrink-0 transition-all duration-300 shadow-sm',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        'flex h-20 items-center justify-center border-b border-gray-200/50 px-6 bg-gradient-to-br from-white to-purple-50/30',
        isCollapsed && 'px-4'
      )}>
        {isCollapsed ? (
          <img
            src="/images/logosmall.png"
            alt="SCASA Logo"
            className="h-12 w-12 object-contain transition-transform duration-300 hover:scale-110"
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-black">SC</span>
              <span className="text-2xl font-bold text-[#8c52ff]">ASA</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <ScrollArea className="flex-1">
        <nav className={cn('flex flex-col gap-2 p-4', isCollapsed && 'p-3')}>
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    'relative w-full justify-start overflow-hidden rounded-xl transition-all duration-300 group',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    isCollapsed ? 'px-3 py-3' : 'px-5 py-4 h-auto min-h-[56px]',
                    isActive
                      ? 'bg-gradient-to-r from-[#8c52ff] to-purple-600 text-white shadow-lg shadow-[#8c52ff]/30 hover:from-[#9d62ff] hover:to-purple-700'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-[#8c52ff]'
                  )}
                >
                  {/* Active indicator bar */}
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-300',
                      isActive
                        ? 'opacity-100 bg-white shadow-sm'
                        : 'opacity-0 group-hover:opacity-100 bg-[#8c52ff] h-6'
                    )}
                  />

                  {/* Icon with better sizing */}
                  <div className={cn(
                    'flex items-center justify-center transition-all duration-300',
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 group-hover:text-[#8c52ff]',
                    !isCollapsed && 'mr-3'
                  )}>
                    <item.icon
                      className={cn(
                        'transition-all duration-300',
                        isCollapsed ? 'h-5 w-5' : 'h-6 w-6',
                        'group-hover:scale-110'
                      )}
                    />
                  </div>

                  {/* Text */}
                  {!isCollapsed && (
                    <span
                      className={cn(
                        'text-base font-semibold transition-colors duration-300',
                        isActive ? 'text-white' : 'text-gray-700 group-hover:text-[#8c52ff]'
                      )}
                    >
                      {item.name}
                    </span>
                  )}

                  {/* Hover arrow indicator */}
                  {!isCollapsed && !isActive && (
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#8c52ff] animate-pulse" />
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout Section */}
      <div className={cn('border-t border-gray-200/50 p-4 bg-gray-50/50', isCollapsed && 'p-3')}>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start rounded-xl border-gray-300/50 bg-white',
            'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50',
            'hover:border-red-300/50 hover:text-red-600',
            'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
            'shadow-sm hover:shadow-md',
            isCollapsed ? 'px-3 py-3 h-auto min-h-[48px]' : 'px-5 py-4 h-auto min-h-[56px]'
          )}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <div className={cn(
            'flex items-center justify-center transition-colors duration-300',
            !isCollapsed && 'mr-3'
          )}>
            <LogOut className={cn(
              'transition-all duration-300',
              isCollapsed ? 'h-5 w-5' : 'h-6 w-6',
              'group-hover:rotate-12'
            )} />
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold text-gray-700 group-hover:text-red-600 transition-colors">
              Logout
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}