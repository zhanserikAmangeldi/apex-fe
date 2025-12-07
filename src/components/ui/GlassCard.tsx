export const GlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full max-w-md p-10 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-2xl">
        {children}
    </div>
);