import {useCallback, useState, useEffect} from "react";
import type {ApiError, AuthResponse, LoginRequest, RegisterRequest, User} from "../types";
import {api} from "../services/api.ts";
import { AuthContext } from "./AuthContext.tsx";

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        api.setAccessToken(null);
        setUser(null);
        window.location.href = '/login';
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        if (isRefreshing) return false;
        
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            logout();
            return false;
        }

        try {
            setIsRefreshing(true);
            const response = await api.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            api.setAccessToken(response.access_token);
            setUser(response.user);
            return true;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            logout();
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, logout]);

    useEffect(() => {
        // Set up unauthorized handler to try refresh token first
        api.setUnauthorizedHandler(async () => {
            console.log('Token expired, attempting to refresh...');
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                logout();
            }
        });

        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (token) {
            api.setAccessToken(token);
        }

        if (token && refreshToken) {
            api.getProfile()
                .then((user) => {
                    setUser(user);
                })
                .catch(async () => {
                    // Try to refresh token
                    const refreshed = await refreshAccessToken();
                    if (!refreshed) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        api.setAccessToken(null);
                        setUser(null);
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [logout, refreshAccessToken]);

    const clearError = useCallback(() => setError(null), []);

    const handleAuthResponse = (response: AuthResponse) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        api.setAccessToken(response.access_token);
        setUser(response.user);
    };

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.login(data);
            handleAuthResponse(response);
        } catch (e) {
            const err = e as ApiError;
            setError(err.message || err.error || 'Login failed');
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.register(data);
            handleAuthResponse(response);
        } catch (e) {
            const err = e as ApiError;
            setError(err.message || err.error || 'Registration failed');
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!localStorage.getItem('access_token') ,
            isLoading,
            login,
            register,
            logout,
            refreshAccessToken,
            error,
            clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
