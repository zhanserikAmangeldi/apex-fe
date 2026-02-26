import type {
    User,
    AuthResponse,
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ApiError
} from '../types';
import { httpClient, rawRequest, getAccessToken, configureTokenStore } from './httpClient';

class ApiService {
    /** Configure the token store (called from AuthProvider) */
    configureAuth(opts: {
        onAuthFailure: () => void;
    }) {
        configureTokenStore(opts);
    }

    getAccessToken(): string | null {
        return getAccessToken();
    }

    /** @deprecated Use configureAuth instead */
    setAccessToken(token: string | null) {
        if (token) localStorage.setItem('access_token', token);
        else localStorage.removeItem('access_token');
    }

    /** @deprecated No longer needed — httpClient handles refresh */
    setUnauthorizedHandler(_handler: () => Promise<void>) {}

    async register(data: RegisterRequest): Promise<AuthResponse> {
        return httpClient.post<AuthResponse>('auth-service/api/v1/auth/register', data, { skipAuth: true });
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        return httpClient.post<AuthResponse>('auth-service/api/v1/auth/login', data, { skipAuth: true });
    }

    async logout(refreshToken: string, accessToken: string): Promise<{ message: string }> {
        return httpClient.post<{ message: string }>('auth-service/api/v1/auth/logout', {
            refresh_token: refreshToken,
            access_token: accessToken,
        });
    }

    async logoutAll(): Promise<{ message: string }> {
        return httpClient.post<{ message: string }>('auth-service/api/v1/auth/logout-all');
    }

    async getActiveSessions(currentToken?: string): Promise<{ sessions: any[]; total: number }> {
        const query = currentToken ? `?current_token=${currentToken}` : '';
        return httpClient.get<{ sessions: any[]; total: number }>(`auth-service/api/v1/auth/sessions${query}`);
    }

    async updateProfile(data: { display_name?: string; bio?: string; status?: string }): Promise<User> {
        return httpClient.put<User>('auth-service/api/v1/users/me', data);
    }

    async getUserById(id: number): Promise<User> {
        return httpClient.get<User>(`auth-service/api/v1/users/${id}`);
    }

    async uploadAvatar(file: File): Promise<{ message: string; path: string }> {
        const formData = new FormData();
        formData.append('avatar', file);

        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await rawRequest('auth-service/api/v1/users/upload-avatar', {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const data = await response.json();
            throw data as ApiError;
        }
        return response.json();
    }

    async getAvatar(): Promise<Blob> {
        const timestamp = new Date().getTime();
        const response = await rawRequest(`auth-service/api/v1/users/avatar?t=${timestamp}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const error: any = new Error('Failed to fetch avatar');
            error.response = { status: response.status };
            throw error;
        }
        return response.blob();
    }

    async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
        return httpClient.post<{ message: string }>('auth/forgot-password', data, { skipAuth: true });
    }

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return httpClient.post<AuthResponse>('auth-service/api/v1/auth/refresh', {
            refresh_token: refreshToken,
        }, { skipAuth: true });
    }

    async getProfile(): Promise<User> {
        return httpClient.get<User>('auth-service/api/v1/users/me');
    }
}

export const api = new ApiService();
