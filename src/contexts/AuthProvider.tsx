import {useCallback, useState, useEffect} from "react";
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

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        console.log(token);
        if (token) {
            api.setAccessToken(token);
        }

        api.getProfile()
            .then((user) => {
                setUser(user);
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                api.setAccessToken(null);
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const handleAuthResponse = (response: AuthResponse) => {
        localStorage.setItem('access_token', response.access_token);
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
        localStorage.removeItem('access_token');
        api.setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!localStorage.getItem('access_token') ,
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
