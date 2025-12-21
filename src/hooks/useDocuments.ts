import { useState, useEffect, useCallback } from 'react';
import { editorApi } from '../services/editorApi';
import type { AppDocument, CreateDocumentRequest } from '../types/editor';

export function useDocuments(vaultId: string | undefined) {
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        if (!vaultId) return;

        try {
            setLoading(true);
            const data = await editorApi.getVaultDocuments(vaultId);
            setDocuments(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    }, [vaultId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const createDocument = useCallback(async (data: CreateDocumentRequest) => {
        if (!vaultId) throw new Error('No vault ID');
        const newDoc = await editorApi.createDocument(vaultId, data);
        setDocuments(prev => [...prev, newDoc]);
        return newDoc;
    }, [vaultId]);

    const updateDocument = useCallback(async (id: string, data: { title?: string }) => {
        const updated = await editorApi.updateDocument(id, data);
        setDocuments(prev => prev.map(d => d.id === id ? updated : d));
        return updated;
    }, []);

    const deleteDocument = useCallback(async (id: string) => {
        await editorApi.deleteDocument(id);
        setDocuments(prev => prev.filter(d => d.id !== id));
    }, []);

    const moveDocument = useCallback(async (id: string, parentId: string | null) => {
        const updated = await editorApi.moveDocument(id, parentId);
        setDocuments(prev => prev.map(d => d.id === id ? updated : d));
        return updated;
    }, []);

    return {
        documents,
        loading,
        error,
        createDocument,
        updateDocument,
        deleteDocument,
        moveDocument,
        refetch: fetchDocuments,
    };
}