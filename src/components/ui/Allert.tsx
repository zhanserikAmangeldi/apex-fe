export const Alert: React.FC<{ type: 'error' | 'success'; message: string; onClose?: () => void }> = ({ type, message, onClose }) => (
    <div className={`p-3 rounded-lg flex items-center justify-between ${type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
        <span className="text-sm">{message}</span>
        {onClose && (
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
    </div>
);