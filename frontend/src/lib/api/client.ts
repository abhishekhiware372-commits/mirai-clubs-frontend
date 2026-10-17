/**
 * MIRAI CLUBS — Centralized API HTTP Client
 * Connects to FastAPI backend (localhost:8000/api/v1).
 * Features graceful fallback to isolated mock repository if offline or in demo mode.
 * DO NOT display fake success if an actual backend call fails!
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If explicitly in mock mode, throw special signal so service methods use mock repository
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    throw new ApiError('MOCK_MODE_ACTIVE', 0);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach JWT Bearer token if present in browser storage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mirai_auth_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status} ${response.statusText}`;
      let errorData;
      try {
        errorData = await response.json();
        if (errorData?.detail) {
          errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Response was not JSON
      }

      throw new ApiError(errorDetail, response.status, errorData);
    }

    // Parse JSON
    return (await response.json()) as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or offline error
    throw new ApiError(error.message || 'Network request failed', 0, error);
  }
}

export { ApiError };
