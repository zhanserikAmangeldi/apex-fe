export const GlassCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`w-full p-8 rounded-xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-2xl ${className || ''}`}>
        {children}
    </div>
);