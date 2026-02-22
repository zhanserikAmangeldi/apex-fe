import { useCallback, useState, useEffect } from "react";
import type { ApiError, AuthResponse, LoginRequest, RegisterRequest, User } from "../types";
import { api } from "../services/api";
import { configureTokenStore } from "../services/httpClient";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        window.location.href = '/login';
    }, []);

    // Configure the unified httpClient's token store once
    useEffect(() => {
        configureTokenStore({
            onAuthFailure: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
                window.location.href = '/login';
            },
        });
    }, []);

    // Load user on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (token && refreshToken) {
            api.getProfile()
                .then((u) => setUser(u))
                .catch(() => {
                    // httpClient already tried refresh — if we're here, it failed
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) { logout(); return false; }

        try {
            const response = await api.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            setUser(response.user);
            return true;
        } catch {
            logout();
            return false;
        }
    }, [logout]);

    const clearError = useCallback(() => setError(null), []);

    const handleAuthResponse = (response: AuthResponse) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
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
            isAuthenticated: !!localStorage.getItem('access_token'),
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
