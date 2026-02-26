import { useState, useEffect, useCallback } from 'react';
import { aiApi } from '../services/aiApi';
import type { SearchResult } from '../services/aiApi';

export function useRelatedNotes(documentId: string | null | undefined, limit = 5) {
    const [related, setRelated] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!documentId) {
            setRelated([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await aiApi.getRelatedNotes(documentId, limit);
            setRelated(data);
        } catch (err) {
            // Silently fail — related notes are non-critical
            setError(err instanceof Error ? err.message : 'Failed to load related notes');
            setRelated([]);
        } finally {
            setLoading(false);
        }
    }, [documentId, limit]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { related, loading, error, refetch: fetch };
}
