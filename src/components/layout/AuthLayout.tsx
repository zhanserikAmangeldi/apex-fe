import {Ellipse} from "../ui/Ellipse.tsx";
import {Logo} from "../ui/Logo.tsx";
import {OutlineButton} from "../ui/Button.tsx";
import {GlassCard} from "../ui/GlassCard.tsx";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    buttonText: string;
    onButtonClick: () => void;
    ellipseColors: { top: string; bottom: string };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, buttonText, onButtonClick, ellipseColors }) => {
    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden flex">
            <Ellipse className="w-72 h-72 top-20 left-[50%]" gradient={ellipseColors.top} />
            <Ellipse className="w-52 h-52 bottom-10 right-10 rotate-[-28deg]" gradient={ellipseColors.bottom} />

            <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative z-10">
                <div className="absolute top-6 left-6">
                    <Logo onClick={() => navigate('/')} />
                </div>
                <h1 className="text-5xl md:text-7xl font-semibold text-white mb-6">{title}</h1>
                <OutlineButton onClick={onButtonClick}>{buttonText}</OutlineButton>
                <div className="absolute left-8 md:left-16 right-1/2 top-1/2 border-t-2 border-dashed border-gray-600 -translate-y-1/2 mt-24" />
            </div>

            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <GlassCard>{children}</GlassCard>
            </div>
        </div>
    );
};
