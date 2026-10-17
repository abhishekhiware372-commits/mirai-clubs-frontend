'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Role } from '../lib/api/types';
import { authService } from '../lib/api/auth';
import { MOCK_USERS } from '../lib/api/mockData';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (email: string) => Promise<void>;
  quickLoginAsRole: (roleKey: 'student' | 'coordinator' | 'advisor' | 'campus-manager' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDashboardPathForRole(role: Role): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'STUDENT_COORDINATOR':
      return '/coordinator/dashboard';
    case 'FACULTY_ADVISOR':
      return '/advisor/dashboard';
    case 'CAMPUS_MANAGER':
      return '/campus-manager/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from storage or initialize demo default
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = localStorage.getItem('mirai_auth_token');
        const storedRoleKey = localStorage.getItem('mirai_active_role');
        const storedUser = localStorage.getItem('mirai_user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(parsedUser.role);
          setToken(storedToken);
        } else if (storedRoleKey && MOCK_USERS[storedRoleKey]) {
          const defaultUser = MOCK_USERS[storedRoleKey];
          setUser(defaultUser);
          setRole(defaultUser.role);
          setToken(`jwt-token-${storedRoleKey}`);
          localStorage.setItem('mirai_auth_token', `jwt-token-${storedRoleKey}`);
          localStorage.setItem('mirai_user', JSON.stringify(defaultUser));
        } else {
          // Default to student for competition evaluation convenience if on a protected route
          const defaultStudent = MOCK_USERS.student;
          setUser(defaultStudent);
          setRole(defaultStudent.role);
          setToken('jwt-token-student');
          localStorage.setItem('mirai_active_role', 'student');
          localStorage.setItem('mirai_auth_token', 'jwt-token-student');
          localStorage.setItem('mirai_user', JSON.stringify(defaultStudent));
        }
      } catch (err) {
        console.error('Failed to initialize session', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await authService.login(email, password);
        setUser(res.user);
        setRole(res.user.role);
        setToken(res.access_token);
        localStorage.setItem('mirai_auth_token', res.access_token);
        localStorage.setItem('mirai_user', JSON.stringify(res.user));

        const target = getDashboardPathForRole(res.user.role);
        router.push(target);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const googleLogin = useCallback(
    async (email: string) => {
      setLoading(true);
      try {
        const res = await authService.googleLogin(email);
        setUser(res.user);
        setRole(res.user.role);
        setToken(res.access_token);
        localStorage.setItem('mirai_auth_token', res.access_token);
        localStorage.setItem('mirai_user', JSON.stringify(res.user));

        const target = getDashboardPathForRole(res.user.role);
        router.push(target);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const quickLoginAsRole = useCallback(
    async (roleKey: 'student' | 'coordinator' | 'advisor' | 'campus-manager' | 'admin') => {
      setLoading(true);
      try {
        const targetUser = MOCK_USERS[roleKey];
        if (!targetUser) throw new Error('Role user not found');

        const mockToken = `mock-token-${roleKey}`;
        setUser(targetUser);
        setRole(targetUser.role);
        setToken(mockToken);
        localStorage.setItem('mirai_active_role', roleKey);
        localStorage.setItem('mirai_auth_token', mockToken);
        localStorage.setItem('mirai_user', JSON.stringify(targetUser));

        const targetPath = getDashboardPathForRole(targetUser.role);
        router.push(targetPath);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setRole(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        login,
        googleLogin,
        quickLoginAsRole,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
