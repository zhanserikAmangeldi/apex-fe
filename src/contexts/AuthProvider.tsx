import {useCallback, useState} from "react";
import type {ApiError, AuthResponse, LoginRequest, RegisterRequest, User} from "../types";
import {api} from "../services/api.ts";
import { AuthContext } from "./AuthContext.tsx";

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const handleAuthResponse = (response: AuthResponse) => {
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

    const logout = () => {
        api.setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            error,
            clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
