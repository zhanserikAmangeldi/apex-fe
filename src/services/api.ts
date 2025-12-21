import type {
    User,
    AuthResponse,
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ApiError
} from '../types';

const API_BASE = 'http://localhost:8000/api/';

class ApiService {
    private baseUrl: string;
    private accessToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw data as ApiError;
        }

        return data as T;
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>('auth-service/api/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>('auth-service/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
        return this.request<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return this.request<AuthResponse>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    }

    async getProfile(): Promise<User> {
        return this.request<User>('auth-service/api/v1/users/me');
    }
}

export const api = new ApiService(API_BASE);