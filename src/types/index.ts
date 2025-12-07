

export interface User {
    id: string;
    username: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: User;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    display_name?: string;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ApiError {
    error: string;
    message?: string;
}

export interface ValidationErrors {
    [key: string]: string;
}


