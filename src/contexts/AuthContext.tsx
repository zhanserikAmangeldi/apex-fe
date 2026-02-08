import {createContext} from "react";
import type {LoginRequest, RegisterRequest, User} from "../types";

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<boolean>;
    error: string | null;
    clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
