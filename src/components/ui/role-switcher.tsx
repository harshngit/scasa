import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ChevronDown } from 'lucide-react';
import { mockUsers } from '@/lib/mockData';
import type { User as UserType } from '@/types';

interface RoleSwitcherProps {
  currentUser: UserType;
  onUserChange: (user: UserType) => void;
}

export function RoleSwitcher({ currentUser, onUserChange }: RoleSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="truncate">{currentUser.name}</span>
            <Badge variant="secondary" className="text-xs">
              {currentUser.role}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Switch User Role (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => onUserChange(user)}
            className={currentUser.id === user.id ? 'bg-accent' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}