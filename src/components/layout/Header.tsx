import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Settings, Menu, Building2, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'resident' | 'vendor';
  flatNumber?: string;
}

export function Header({ onToggleSidebar, isSidebarCollapsed = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Search functionality
  useEffect(() => {
    const searchData = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        // Search residents
        const { data: residents } = await supabase
          .from('residents')
          .select('id, owner_name, flat_number')
          .ilike('owner_name', `%${searchTerm}%`)
          .limit(5);

        // Search vendors
        const { data: vendors } = await supabase
          .from('vendors')
          .select('id, vendor_name')
          .ilike('vendor_name', `%${searchTerm}%`)
          .limit(5);

        const results: SearchResult[] = [
          ...(residents || []).map(r => ({
            id: r.id,
            name: r.owner_name,
            type: 'resident' as const,
            flatNumber: r.flat_number
          })),
          ...(vendors || []).map(v => ({
            id: v.id,
            name: v.vendor_name,
            type: 'vendor' as const
          }))
        ];

        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'resident') {
      navigate(`/residents/${result.id}`);
    } else {
      navigate(`/vendors/${result.id}`);
    }
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-black/10 bg-white backdrop-blur px-6 shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-full hover:bg-[#8c52ff]/10 text-black"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative max-w-xl w-full" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50 z-10" />
          <Input
            placeholder="Search Vendor Name and Resident Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="pl-10 w-full rounded-full border-black/20 bg-white hover:bg-white hover:border-[#8c52ff]/30 focus:bg-white focus:ring-2 focus:ring-[#8c52ff]/20 focus:border-[#8c52ff] text-black placeholder:text-black/50"
          />
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#8c52ff]" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#8c52ff]/10 text-left transition-colors"
                    >
                      {result.type === 'resident' ? (
                        <Users className="h-4 w-4 text-[#8c52ff]" />
                      ) : (
                        <Building2 className="h-4 w-4 text-[#8c52ff]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-black truncate">{result.name}</div>
                        {result.flatNumber && (
                          <div className="text-xs text-black/70">Flat: {result.flatNumber}</div>
                        )}
                        <div className="text-xs text-black/50 capitalize">{result.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.trim().length >= 2 ? (
                <div className="p-4 text-center text-sm text-black/70">
                  No results found
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-[#8c52ff]/10 text-black">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#8c52ff] text-[10px] text-white font-semibold flex items-center justify-center shadow-sm">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 ">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/user.png" alt={user.name} />
                  <AvatarFallback className="bg-[#8c52ff] text-white">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-black leading-tight">{user.name}</span>
                  <span className="text-[11px] text-black/70 capitalize">{user.role}</span>
                </div> */}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-black/10" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-black">{user.name}</p>
                <p className="text-xs leading-none text-black/70">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-black/70">
                  Role: {user.role}
                  {user.flatNumber && ` • Flat: ${user.flatNumber}`}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-black/10" />
            <DropdownMenuItem
              onClick={() => navigate('/profile')}
              className="text-black hover:bg-[#8c52ff]/10 hover:text-[#8c52ff] focus:bg-[#8c52ff]/10 focus:text-[#8c52ff]"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/settings')}
              className="text-black hover:bg-[#8c52ff]/10 hover:text-[#8c52ff] focus:bg-[#8c52ff]/10 focus:text-[#8c52ff]"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/10" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-black hover:bg-[#8c52ff]/10 hover:text-[#8c52ff] focus:bg-[#8c52ff]/10 focus:text-[#8c52ff]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}