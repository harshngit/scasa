import React, { createContext, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, setLoading, logout as logoutAction } from '@/store/slices/authSlice';
import { supabase } from '@/lib/supabase';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import type { User } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (emailOrMobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  role: 'admin' | 'receptionist' | 'resident';
  flatNumber?: string;
}

interface UserRow {
  user_id: string;
  user_name: string;
  email: string;
  mobile_number: string | null;
  password_hash: string;
  role: 'admin' | 'receptionist' | 'resident';
  flat_no: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for stored user session on mount
    const checkSession = async () => {
      dispatch(setLoading(true));
      try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
          // Verify user still exists in database
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', parsedUser.id)
            .single();

          if (!error && data) {
            const userData = mapUserFromDB(data);
            dispatch(setUser(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));
          } else {
            // User not found, clear session
            localStorage.removeItem('currentUser');
            dispatch(setUser(null));
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('currentUser');
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    checkSession();
  }, [dispatch]);

  const mapUserFromDB = (dbUser: UserRow): User => {
    const permissions = ROLE_PERMISSIONS[dbUser.role] || [];
    return {
      id: dbUser.user_id,
      name: dbUser.user_name,
      email: dbUser.email,
      role: dbUser.role,
      flatNumber: dbUser.flat_no || undefined,
      permissions: permissions.map((p) => p.module),
    };
  };

  const login = async (
    emailOrMobile: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    dispatch(setLoading(true));
    try {
      // Try to find user by email or mobile number
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${emailOrMobile},mobile_number.eq.${emailOrMobile}`)
        .single();

      if (error || !data) {
        dispatch(setLoading(false));
        return { success: false, error: 'Invalid email/mobile or password' };
      }

      // Verify password
      if (!verifyPassword(password, data.password_hash)) {
        dispatch(setLoading(false));
        return { success: false, error: 'Invalid email/mobile or password' };
      }

      // Map database user to app user
      const userData = mapUserFromDB(data);
      dispatch(setUser(userData));
      localStorage.setItem('currentUser', JSON.stringify(userData));
      dispatch(setLoading(false));
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      dispatch(setLoading(false));
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    dispatch(setLoading(true));
    try {
    // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${userData.email}${userData.mobileNumber ? `,mobile_number.eq.${userData.mobileNumber}` : ''}`)
        .single();

    if (existingUser) {
        dispatch(setLoading(false));
        return { success: false, error: 'User with this email or mobile number already exists' };
    }

    // Validate required fields based on role
    if (userData.role === 'resident' && !userData.flatNumber) {
        dispatch(setLoading(false));
      return { success: false, error: 'Flat number is required for residents' };
    }

      // Hash password
      const passwordHash = hashPassword(userData.password);

      // Insert new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          user_name: userData.name,
      email: userData.email,
          mobile_number: userData.mobileNumber || null,
          password_hash: passwordHash,
      role: userData.role,
          flat_no: userData.flatNumber || null,
        })
        .select()
        .single();

      if (error) {
        dispatch(setLoading(false));
        return { success: false, error: error.message || 'Failed to create user' };
      }

    // Auto-login after signup
      const mappedUser = mapUserFromDB(data);
      dispatch(setUser(mappedUser));
      localStorage.setItem('currentUser', JSON.stringify(mappedUser));
      dispatch(setLoading(false));
    return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      dispatch(setLoading(false));
      return { success: false, error: error.message || 'An error occurred during signup' };
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
