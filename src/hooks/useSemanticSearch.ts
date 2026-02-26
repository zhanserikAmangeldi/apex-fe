import { useState, useCallback, useRef } from 'react';
import { aiApi } from '../services/aiApi';
import type { SearchResult } from '../services/aiApi';

export function useSemanticSearch() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const search = useCallback(async (q: string, limit = 10) => {
        setQuery(q);

        if (!q.trim() || q.trim().length < 2) {
            setResults([]);
            setError(null);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await aiApi.semanticSearch(q.trim(), limit);
                setResults(response.results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Search failed');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const clear = useCallback(() => {
        setResults([]);
        setQuery('');
        setError(null);
    }, []);

    return { results, loading, error, query, search, clear };
}
