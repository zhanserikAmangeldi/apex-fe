import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { editorApi } from '../services/editorApi';
import type { NoteConnection, ConnectionType, AppDocument } from '../types/editor';

interface NoteConnectionsProps {
    documentId: string | null | undefined;
    vaultId?: string;
    onSelectDocument: (documentId: string) => void;
}

const CONNECTION_COLORS: Record<string, string> = {
    related: '#8b5cf6',
    supports: '#10b981',
    contradicts: '#ef4444',
    extends: '#3b82f6',
    references: '#f59e0b',
    inspired_by: '#ec4899',
};

const CONNECTION_ICONS: Record<string, string> = {
    related: '🔗',
    supports: '✅',
    contradicts: '⚡',
    extends: '📎',
    references: '📌',
    inspired_by: '💡',
};

const ALL_TYPES: ConnectionType[] = ['related', 'supports', 'contradicts', 'extends', 'references', 'inspired_by'];

export const NoteConnections: React.FC<NoteConnectionsProps> = ({ documentId, vaultId, onSelectDocument }) => {
    const [connections, setConnections] = useState<NoteConnection[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AppDocument[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedType, setSelectedType] = useState<ConnectionType>('related');
    const [editingId, setEditingId] = useState<string | null>(null);

    const outgoing = useMemo(() => connections.filter(c => c.direction === 'outgoing'), [connections]);
    const incoming = useMemo(() => connections.filter(c => c.direction === 'incoming'), [connections]);

    const fetchConnections = useCallback(async () => {
        if (!documentId) { setConnections([]); return; }
        try {
            setLoading(true);
            const data = await editorApi.getNoteConnections(documentId);
            setConnections(data);
        } catch { setConnections([]); }
        finally { setLoading(false); }
    }, [documentId]);

    useEffect(() => { fetchConnections(); }, [fetchConnections]);

    useEffect(() => {
        const handler = () => fetchConnections();
        window.addEventListener('connections-changed', handler);
        return () => window.removeEventListener('connections-changed', handler);
    }, [fetchConnections]);

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length < 2) { setSearchResults([]); return; }
        try {
            setSearching(true);
            const results = await editorApi.searchDocuments(query, vaultId, 10);
            setSearchResults(results.filter(d => d.id !== documentId && !d.is_folder));
        } catch { setSearchResults([]); }
        finally { setSearching(false); }
    }, [vaultId, documentId]);

    const handleCreateConnection = async (targetId: string) => {
        if (!documentId) return;
        try {
            await editorApi.createConnection(documentId, targetId, selectedType);
            setShowAdd(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchConnections();
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('409') || msg.includes('already exists')) {
                alert('Connection already exists');
            }
        }
    };

    const handleDelete = async (connectionId: string) => {
        try {
            await editorApi.deleteConnection(connectionId);
            setEditingId(null);
            fetchConnections();
        } catch { /* ignore */ }
    };

    const handleChangeType = async (connectionId: string, newType: ConnectionType) => {
        try {
            await editorApi.updateConnection(connectionId, { connectionType: newType });
            setEditingId(null);
            fetchConnections();
        } catch { /* ignore */ }
    };

    if (!documentId) return null;

    const renderConnection = (conn: NoteConnection) => (
        <div key={conn.id}>
            <div className="flex items-center gap-1 group">
                <button
                    onClick={() => onSelectDocument(conn.connected_note_id)}
                    className="flex-1 text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors flex items-center gap-2 min-w-0"
                >
                    <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CONNECTION_COLORS[conn.connection_type] || '#8b5cf6' }}
                    />
                    <span className="text-xs shrink-0" title={conn.connection_type.replace(/_/g, ' ')}>
                        {CONNECTION_ICONS[conn.connection_type] || '🔗'}
                    </span>
                    <span className="text-sm text-gray-300 group-hover:text-white truncate">
                        {conn.connected_note_title || 'Untitled'}
                    </span>
                    {conn.is_inline && (
                        <span className="text-[9px] text-purple-400/50 shrink-0 ml-auto" title="From inline [[link]]">
                            [[]]
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setEditingId(editingId === conn.id ? null : conn.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-indigo-400 transition-all shrink-0 p-1"
                    title="Change type"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                {!conn.is_inline && (
                    <button
                        onClick={() => handleDelete(conn.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0 p-1"
                        title="Remove connection"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            {editingId === conn.id && (
                <div className="ml-6 mt-1 mb-2 flex flex-wrap gap-1">
                    {ALL_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleChangeType(conn.id, type)}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                                conn.connection_type === type
                                    ? 'bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/50'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                            }`}
                        >
                            {CONNECTION_ICONS[type]} {type.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="border-t border-white/10 p-4">
            {/* Header */}
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connections ({connections.length})
                </span>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Add connection"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAdd ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                    </svg>
                </button>
            </h4>

            {/* Add connection form */}
            {showAdd && (
                <div className="mb-3 space-y-2">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as ConnectionType)}
                        className="w-full px-2 py-1.5 rounded bg-white/10 border border-white/20 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500/50"
                    >
                        {ALL_TYPES.map((type) => (
                            <option key={type} value={type} className="bg-gray-900">
                                {CONNECTION_ICONS[type]} {type.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search notes to connect..."
                        className="w-full px-2 py-1.5 rounded bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 outline-none focus:ring-1 focus:ring-indigo-500/50"
                        autoFocus
                    />
                    {searching && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs py-1">
                            <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                            Searching...
                        </div>
                    )}
                    {searchResults.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => handleCreateConnection(doc.id)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-500/20 transition-colors flex items-center gap-2 text-xs"
                        >
                            <span>{doc.icon || '📄'}</span>
                            <span className="text-gray-300 truncate">{doc.title}</span>
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
                    <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    Loading...
                </div>
            )}

            {!loading && connections.length === 0 && !showAdd && (
                <p className="text-gray-600 text-xs">No connections yet</p>
            )}

            {!loading && connections.length > 0 && (
                <div className="space-y-4">
                    {/* Outgoing: this note links to */}
                    {outgoing.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
                                    Links to ({outgoing.length})
                                </span>
                            </div>
                            <div className="space-y-0.5 pl-1 border-l-2 border-blue-500/20">
                                {outgoing.map(renderConnection)}
                            </div>
                        </div>
                    )}

                    {/* Incoming: other notes link here */}
                    {incoming.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                </svg>
                                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                                    Linked from ({incoming.length})
                                </span>
                            </div>
                            <div className="space-y-0.5 pl-1 border-l-2 border-emerald-500/20">
                                {incoming.map(renderConnection)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
