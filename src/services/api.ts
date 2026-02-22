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
    private onUnauthorized: (() => Promise<void>) | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    setUnauthorizedHandler(handler: () => Promise<void>) {
        this.onUnauthorized = handler;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const url = `${this.baseUrl}${endpoint}`;
        console.log('API request:', { url, method: options.method || 'GET', hasToken: !!this.accessToken });

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            console.log('API response:', { url, status: response.status, ok: response.ok });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (this.onUnauthorized) {
                    await this.onUnauthorized();
                    // Retry the request with new token
                    const newHeaders: HeadersInit = {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    };
                    if (this.accessToken) {
                        (newHeaders as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
                    }
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers: newHeaders,
                    });
                    
                    if (!retryResponse.ok) {
                        const data = await retryResponse.json();
                        throw data as ApiError;
                    }
                    return retryResponse.json() as T;
                }
                const error: any = new Error('Unauthorized');
                error.status = 401;
                throw error;
            }

            const data = await response.json();

            if (!response.ok) {
                throw data as ApiError;
            }

            return data as T;
        } catch (error: any) {
            console.error('API request failed:', { url, error: error.message, name: error.name });
            throw error;
        }
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

    async logout(refreshToken: string, accessToken: string): Promise<{ message: string }> {
        return this.request<{ message: string }>('auth-service/api/v1/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken, access_token: accessToken }),
        });
    }

    async logoutAll(): Promise<{ message: string }> {
        return this.request<{ message: string }>('auth-service/api/v1/auth/logout-all', {
            method: 'POST',
        });
    }

    async getActiveSessions(currentToken?: string): Promise<{ sessions: any[]; total: number }> {
        const query = currentToken ? `?current_token=${currentToken}` : '';
        return this.request<{ sessions: any[]; total: number }>(`auth-service/api/v1/auth/sessions${query}`, {
            method: 'GET',
        });
    }

    async updateProfile(data: { display_name?: string; bio?: string; status?: string }): Promise<User> {
        return this.request<User>('auth-service/api/v1/users/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async getUserById(id: number): Promise<User> {
        return this.request<User>(`auth-service/api/v1/users/${id}`, {
            method: 'GET',
        });
    }

    async uploadAvatar(file: File): Promise<{ message: string; path: string }> {
        const formData = new FormData();
        formData.append('avatar', file);

        const headers: HeadersInit = {};
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(`${this.baseUrl}auth-service/api/v1/users/upload-avatar`, {
            method: 'POST',
            headers,
            body: formData,
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            if (this.onUnauthorized) {
                this.onUnauthorized();
            }
            const error: any = new Error('Unauthorized');
            error.status = 401;
            throw error;
        }

        const data = await response.json();
        if (!response.ok) {
            throw data as ApiError;
        }

        return data;
    }

    async getAvatar(): Promise<Blob> {
        const headers: HeadersInit = {};
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        // Add cache busting parameter to force fresh fetch
        const timestamp = new Date().getTime();
        const url = `${this.baseUrl}auth-service/api/v1/users/avatar?t=${timestamp}`;

        const response = await fetch(url, {
            method: 'GET',
            headers,
            cache: 'no-cache', // Disable browser cache
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            if (this.onUnauthorized) {
                this.onUnauthorized();
            }
            const error: any = new Error('Unauthorized');
            error.status = 401;
            error.response = { status: 401 };
            throw error;
        }

        if (!response.ok) {
            const error: any = new Error('Failed to fetch avatar');
            error.response = { status: response.status };
            throw error;
        }

        return response.blob();
    }

    async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
        return this.request<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        console.log('Calling refreshToken API with token:', refreshToken.substring(0, 30) + '...');
        return this.request<AuthResponse>('auth-service/api/v1/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    }

    async getProfile(): Promise<User> {
        return this.request<User>('auth-service/api/v1/users/me');
    }
}

export const api = new ApiService(API_BASE);