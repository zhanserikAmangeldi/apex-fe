export const Ellipse: React.FC<{ className: string; gradient: string }> = ({ className, gradient }) => (
    <div className={`absolute rounded-full blur-sm ${className}`} style={{ background: gradient }} />
);
