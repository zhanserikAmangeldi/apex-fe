import React, { useState, useEffect, useCallback } from 'react';
import { editorApi } from '../services/editorApi';

interface BacklinksProps {
    documentId: string | null | undefined;
    onSelectDocument: (documentId: string) => void;
}

interface BacklinkItem {
    id: string;
    title: string;
    icon: string;
    connectionType?: string;
}

const CONNECTION_ICONS: Record<string, string> = {
    related: '🔗',
    supports: '✅',
    contradicts: '⚡',
    extends: '📎',
    references: '📌',
    inspired_by: '💡',
};

export const Backlinks: React.FC<BacklinksProps> = ({ documentId, onSelectDocument }) => {
    const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBacklinks = useCallback(async () => {
        if (!documentId) {
            setBacklinks([]);
            return;
        }
        try {
            setLoading(true);
            const data = await editorApi.getBacklinks(documentId);
            setBacklinks(data);
        } catch {
            setBacklinks([]);
        } finally {
            setLoading(false);
        }
    }, [documentId]);

    useEffect(() => {
        fetchBacklinks();
    }, [fetchBacklinks]);

    useEffect(() => {
        const handler = () => fetchBacklinks();
        window.addEventListener('connections-changed', handler);
        return () => window.removeEventListener('connections-changed', handler);
    }, [fetchBacklinks]);

    if (!documentId) return null;

    return (
        <div className="border-t border-white/10 p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Backlinks ({backlinks.length})
            </h4>

            {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
                    <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    Loading...
                </div>
            )}

            {!loading && backlinks.length === 0 && (
                <p className="text-gray-600 text-xs">No documents link here</p>
            )}

            <div className="space-y-1">
                {backlinks.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => onSelectDocument(link.id)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors group flex items-center gap-2"
                    >
                        <span className="text-xs shrink-0" title={link.connectionType}>
                            {CONNECTION_ICONS[link.connectionType || 'related'] || '🔗'}
                        </span>
                        <span className="text-sm shrink-0">{link.icon}</span>
                        <span className="text-sm text-gray-300 group-hover:text-white truncate">
                            {link.title || 'Untitled'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
