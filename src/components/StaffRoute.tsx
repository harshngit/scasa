import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface StaffRouteProps {
  children: ReactNode;
}

// Allows access for admin or receptionist; blocks others
export default function StaffRoute({ children }: StaffRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'receptionist') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


