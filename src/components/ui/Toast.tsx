import React, { useEffect } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.type !== 'loading') {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.type, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'loading':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'success':
        return 'bg-green-500/20 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 border-red-500/30';
      case 'info':
        return 'bg-purple-500/20 border-purple-500/30';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm ${getColors()} animate-slide-in-right`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm">{toast.message}</p>
        {toast.description && (
          <p className="text-white/60 text-xs mt-1">{toast.description}</p>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
