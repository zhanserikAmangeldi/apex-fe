import { useState, useEffect, useCallback } from 'react';
import { editorApi } from '../services/editorApi';
import type { Vault, CreateVaultRequest } from '../types/editor';

export function useVaults() {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVaults = useCallback(async () => {
        try {
            setLoading(true);
            const data = await editorApi.getVaults();
            setVaults(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch vaults');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVaults();
    }, [fetchVaults]);

    const createVault = useCallback(async (data: CreateVaultRequest) => {
        const newVault = await editorApi.createVault(data);
        setVaults(prev => [newVault, ...prev]);
        return newVault;
    }, []);

    const updateVault = useCallback(async (id: string, data: Partial<CreateVaultRequest>) => {
        const updated = await editorApi.updateVault(id, data);
        setVaults(prev => prev.map(v => v.id === id ? updated : v));
        return updated;
    }, []);

    const deleteVault = useCallback(async (id: string) => {
        await editorApi.deleteVault(id);
        setVaults(prev => prev.filter(v => v.id !== id));
    }, []);

    return {
        vaults,
        loading,
        error,
        createVault,
        updateVault,
        deleteVault,
        refetch: fetchVaults,
    };
}