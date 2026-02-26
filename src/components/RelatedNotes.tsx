import React from 'react';
import { useRelatedNotes } from '../hooks/useRelatedNotes';

interface RelatedNotesProps {
    documentId: string | null | undefined;
    onSelectDocument: (documentId: string) => void;
}

export const RelatedNotes: React.FC<RelatedNotesProps> = ({ documentId, onSelectDocument }) => {
    const { related, loading } = useRelatedNotes(documentId);

    if (!documentId) return null;

    return (
        <div className="border-t border-white/10 p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Related Notes
            </h4>

            {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
                    <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    Finding related...
                </div>
            )}

            {!loading && related.length === 0 && (
                <p className="text-gray-600 text-xs">No related notes yet</p>
            )}

            <div className="space-y-1">
                {related.map((note) => (
                    <button
                        key={note.document_id}
                        onClick={() => onSelectDocument(note.document_id)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors group flex items-center gap-2"
                    >
                        <span className="text-xs text-gray-500 group-hover:text-indigo-400 shrink-0">
                            {Math.round(note.score * 100)}%
                        </span>
                        <span className="text-sm text-gray-300 group-hover:text-white truncate">
                            {note.title || 'Untitled'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
