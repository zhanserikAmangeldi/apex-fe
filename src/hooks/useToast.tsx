import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '../components/ui/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, description?: string) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, message, description };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const updateToast = useCallback((id: string, type: ToastType, message: string, description?: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, type, message, description } : toast
      )
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const loading = useCallback((message: string, description?: string) => {
    return addToast('loading', message, description);
  }, [addToast]);

  const success = useCallback((message: string, description?: string) => {
    return addToast('success', message, description);
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    return addToast('error', message, description);
  }, [addToast]);

  const info = useCallback((message: string, description?: string) => {
    return addToast('info', message, description);
  }, [addToast]);

  return {
    toasts,
    loading,
    success,
    error,
    info,
    updateToast,
    removeToast,
  };
};
