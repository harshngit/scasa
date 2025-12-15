import { User, ROLE_PERMISSIONS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

export const getCurrentUser = (): User => {
  // This is for backward compatibility with existing code
  // In real implementation, this would throw an error if no user is logged in
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
  }
  
  // Fallback for demo purposes - should not happen in real app
  return {
    id: '1',
    name: 'Demo User',
    email: 'demo@society.com',
    role: 'admin',
    permissions: ['all']
  };
};

export const isAuthenticated = (): boolean => {
  const storedUser = localStorage.getItem('currentUser');
  return !!storedUser;
};

export const hasPermission = (module: string, action: string, user?: User): boolean => {
  const userToCheck = user || getCurrentUser();
  const rolePermissions = ROLE_PERMISSIONS[userToCheck.role];
  
  if (!rolePermissions) return false;
  
  const modulePermission = rolePermissions.find(p => p.module === module);
  if (!modulePermission) return false;
  
  return modulePermission.actions.includes(action) || modulePermission.actions.includes('admin');
};

export const canAccess = (module: string, user?: User): boolean => {
  return hasPermission(module, 'read', user);
};

export const canWrite = (module: string, user?: User): boolean => {
  return hasPermission(module, 'write', user);
};

export const canDelete = (module: string, user?: User): boolean => {
  return hasPermission(module, 'delete', user);
};

export const isAdmin = (user?: User): boolean => {
  const userToCheck = user || getCurrentUser();
  return userToCheck.role === 'admin';
};

export const isAdminOrReceptionist = (user?: User): boolean => {
  const userToCheck = user || getCurrentUser();
  return userToCheck.role === 'admin' || userToCheck.role === 'receptionist';
};

export const isResident = (user?: User): boolean => {
  const userToCheck = user || getCurrentUser();
  return userToCheck.role === 'resident';
};

export const isReceptionist = (user?: User): boolean => {
  const userToCheck = user || getCurrentUser();
  return userToCheck.role === 'receptionist';
};