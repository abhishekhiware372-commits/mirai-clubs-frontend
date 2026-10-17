import { apiClient, ApiError } from './client';
import { User, AuthResponse, Role } from './types';
import { MOCK_USERS } from './mockData';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      return await apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (err: any) {
      // In offline/mock fallback:
      if (err.status === 0 || err.message === 'MOCK_MODE_ACTIVE' || err.message?.includes('Failed to fetch')) {
        const found = Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (found && password === 'MiraiDemo#2026') {
          return {
            access_token: `mock-jwt-token-${found.role.toLowerCase()}`,
            token_type: 'bearer',
            user: found,
          };
        }
        if (!found) {
          throw new ApiError('Incorrect email or password', 401);
        }
      }
      throw err;
    }
  },

  async googleLogin(email: string, idToken?: string): Promise<AuthResponse> {
    try {
      return await apiClient<AuthResponse>('/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({ email, id_token: idToken }),
      });
    } catch (err: any) {
      if (err.status === 0 || err.message === 'MOCK_MODE_ACTIVE' || err.message?.includes('Failed to fetch')) {
        const found = Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          return {
            access_token: `mock-google-jwt-${found.role.toLowerCase()}`,
            token_type: 'bearer',
            user: found,
          };
        }
        throw new ApiError('Account not registered in MIRAI CLUBS institutional registry.', 403);
      }
      throw err;
    }
  },

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    student_id?: string;
    campus_id?: string;
    department?: string;
    year?: string;
  }): Promise<User> {
    try {
      return await apiClient<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.status === 0 || err.message === 'MOCK_MODE_ACTIVE' || err.message?.includes('Failed to fetch')) {
        const newUser: User = {
          id: `usr-reg-${Date.now()}`,
          email: data.email,
          full_name: data.full_name,
          student_id: data.student_id,
          role: 'STUDENT',
          campus_id: data.campus_id || 'camp-blr',
          department: data.department || 'Computer Science',
          year: data.year || '1st Year',
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
        };
        return newUser;
      }
      throw err;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      return await apiClient<User>('/auth/me');
    } catch (err: any) {
      if (err.status === 0 || err.message === 'MOCK_MODE_ACTIVE' || err.message?.includes('Failed to fetch')) {
        // Return stored user or default to student
        if (typeof window !== 'undefined') {
          const savedRole = localStorage.getItem('mirai_active_role') || 'student';
          return MOCK_USERS[savedRole] || MOCK_USERS.student;
        }
        return MOCK_USERS.student;
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mirai_auth_token');
      localStorage.removeItem('mirai_active_role');
      localStorage.removeItem('mirai_user');
    }
  },
};
