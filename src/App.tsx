import './index.css'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider.tsx";
import { useAuth } from "./hooks/UseAuth.tsx";

import { WelcomePage } from "./pages/WelcomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { WorkspacePage } from "./pages/WorkspacePage.tsx";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={
                <PublicRoute>
                    <WelcomePage />
                </PublicRoute>
            } />
            <Route path="/login" element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <RegisterPage />
                </PublicRoute>
            } />
            <Route path="/forgot-password" element={
                <PublicRoute>
                    <ForgotPasswordPage />
                </PublicRoute>
            } />

            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } />
            <Route path="/workspace/:vaultId" element={
                <ProtectedRoute>
                    <WorkspacePage />
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                    <AppRoutes />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}