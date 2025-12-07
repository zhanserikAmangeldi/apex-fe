interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'purple' | 'pink' | 'blue';
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
}

export const GradientButton: React.FC<ButtonProps> = ({
                                                          children, onClick, className = '', variant = 'purple', type = 'button', disabled, loading
                                                      }) => {
    const gradients = {
        purple: 'from-blue-500 via-purple-600 to-purple-800',
        pink: 'from-pink-500 via-pink-600 to-pink-800',
        blue: 'from-blue-500 via-blue-600 to-blue-800'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={` py-3.5 rounded-xl bg-gradient-to-r ${gradients[variant]} text-white font-semibold text-lg 
        hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
            ) : children}
        </button>
    );
};

export const OutlineButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
    <button
        onClick={onClick}
        className="px-6 py-3 border-4 border-white text-white font-semibold text-xl italic hover:bg-white/10 transition-colors"
    >
        {children}
    </button>
);
