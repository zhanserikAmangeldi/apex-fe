import './index.css'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider.tsx";

import { WelcomePage } from "./pages/WelcomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.tsx";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div style={{ fontFamily: "'Noto Sans', sans-serif" }}>

                    <Routes>
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}
