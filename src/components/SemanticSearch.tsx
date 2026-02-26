import React, { useState, useCallback, useRef } from 'react';
import { useSemanticSearch } from '../hooks/useSemanticSearch';
import { editorApi } from '../services/editorApi';
import type { FullTextResult } from '../services/editorApi';

interface SemanticSearchProps {
    vaultId?: string;
    onSelectDocument: (documentId: string) => void;
    onClose: () => void;
}

export const SemanticSearch: React.FC<SemanticSearchProps> = ({ vaultId, onSelectDocument, onClose }) => {
    const [mode, setMode] = useState<'ai' | 'text'>('ai');
    const { results: aiResults, loading: aiLoading, error: aiError, search: aiSearch, clear: aiClear } = useSemanticSearch();
    const [textResults, setTextResults] = useState<FullTextResult[]>([]);
    const [textLoading, setTextLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const searchText = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim() || q.trim().length < 2) {
            setTextResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                setTextLoading(true);
                const results = await editorApi.searchFullText(q.trim(), vaultId);
                setTextResults(results);
            } catch {
                setTextResults([]);
            } finally {
                setTextLoading(false);
            }
        }, 300);
    }, [vaultId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (mode === 'ai') aiSearch(val);
        else searchText(val);
    };

    const handleSelect = (documentId: string) => {
        onSelectDocument(documentId);
    };

    const handleModeSwitch = (newMode: 'ai' | 'text') => {
        setMode(newMode);
        if (inputValue.trim().length >= 2) {
            if (newMode === 'ai') aiSearch(inputValue);
            else searchText(inputValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    const loading = mode === 'ai' ? aiLoading : textLoading;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                    </h3>
                    <button onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-1 mb-3 bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => handleModeSwitch('ai')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            mode === 'ai' ? 'bg-indigo-500/30 text-indigo-200' : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        AI Semantic
                    </button>
                    <button
                        onClick={() => handleModeSwitch('text')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            mode === 'text' ? 'bg-emerald-500/30 text-emerald-200' : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Full Text
                    </button>
                </div>

                <div className="relative">
                    <input type="text" value={inputValue} onChange={handleChange} onKeyDown={handleKeyDown}
                        placeholder={mode === 'ai' ? 'Search by meaning...' : 'Search exact text...'}
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30" />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {mode === 'ai' && aiError && (
                    <p className="text-red-400 text-xs px-2 py-1">{aiError}</p>
                )}

                {/* AI results */}
                {mode === 'ai' && aiResults.length === 0 && inputValue.length >= 2 && !aiLoading && (
                    <p className="text-gray-500 text-xs px-2 py-4 text-center">No results found</p>
                )}
                {mode === 'ai' && aiResults.map((result) => (
                    <button key={result.document_id} onClick={() => handleSelect(result.document_id)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group mb-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-200 group-hover:text-white truncate flex-1">
                                {result.title || 'Untitled'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 shrink-0">
                                {Math.round(result.score * 100)}%
                            </span>
                        </div>
                        <div className="mt-1 w-full bg-white/5 rounded-full h-1">
                            <div className="bg-indigo-500/60 h-1 rounded-full transition-all"
                                style={{ width: `${Math.round(result.score * 100)}%` }} />
                        </div>
                    </button>
                ))}

                {/* Full-text results */}
                {mode === 'text' && textResults.length === 0 && inputValue.length >= 2 && !textLoading && (
                    <p className="text-gray-500 text-xs px-2 py-4 text-center">No results found</p>
                )}
                {mode === 'text' && textResults.map((result) => (
                    <button key={result.document_id} onClick={() => handleSelect(result.document_id)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group mb-1">
                        <span className="text-sm text-gray-200 group-hover:text-white truncate block">
                            {result.title || 'Untitled'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 block truncate">
                            {result.snippet}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
