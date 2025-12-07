import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Ellipse } from "../components/ui/Ellipse.tsx";
import { Logo } from "../components/ui/Logo.tsx";
import { GradientButton } from "../components/ui/Button.tsx";

export const WelcomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden flex flex-col">
            <Ellipse className="w-36 h-36 -top-14 left-96 rotate-[-28deg]" gradient="linear-gradient(180deg, #000F61 0%, #0A1730 100%)" />
            <Ellipse className="w-72 h-72 top-36 right-40" gradient="linear-gradient(180deg, #530061 0%, #0D0A30 100%)" />
            <Ellipse className="w-52 h-52 -bottom-10 -left-10 rotate-[-28deg]" gradient="linear-gradient(180deg, #61004B 0%, #220A30 100%)" />

            <header className="flex justify-between items-center p-6 relative z-10">
                <Logo />
                <GradientButton
                    onClick={() => navigate('/login')}
                    className="w-fit px-6"
                >Sign In</GradientButton>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
                <div className="px-6 py-3 rounded-full bg-blue-400/30 backdrop-blur-sm mb-6">
                    <span className="text-white font-semibold">AI-Powered Learning Platform</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white text-center leading-tight mb-6 max-w-4xl">
                    Master Knowledge with<br />Apex & AI
                </h1>

                <p className="text-white/80 text-center max-w-3xl mb-8 text-sm md:text-base">
                    Transform your self-study experience with an intelligent note-taking system that connects ideas,
                    discovers patterns and accelerates your learning through AI-powered insights
                </p>

                <GradientButton onClick={() => navigate('/register')} className="w-auto px-12">
                    Get Started
                </GradientButton>
            </main>

            <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none opacity-30">
                <svg className="w-full h-full" viewBox="0 0 1440 256" preserveAspectRatio="none">
                    {[...Array(40)].map((_, i) => (
                        <path key={i} d={`M0 ${256 - i * 4} Q360 ${200 - i * 3} 720 ${220 - i * 3} T1440 ${256 - i * 4}`}
                              stroke={`rgba(100, 100, 255, ${0.1 + i * 0.02})`} strokeWidth="1" fill="none" />
                    ))}
                </svg>
            </div>
        </div>
    );
};