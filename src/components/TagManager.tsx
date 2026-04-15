import React, { useState, useEffect } from 'react';
import { editorApi } from '../services/editorApi';
import type { Tag } from '../types/editor';

interface TagManagerProps {
    documentId: string;
    vaultId: string;
    onClose: () => void;
    onUpdate?: () => void;
}

const DEFAULT_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

export const TagManager: React.FC<TagManagerProps> = ({ documentId, vaultId, onClose, onUpdate }) => {
    const [vaultTags, setVaultTags] = useState<Tag[]>([]);
    const [documentTags, setDocumentTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTags();
    }, [documentId, vaultId]);

    const loadTags = async () => {
        try {
            setLoading(true);
            const [allTags, docTags] = await Promise.all([
                editorApi.getVaultTags(vaultId),
                editorApi.getDocumentTags(documentId)
            ]);
            setVaultTags(allTags);
            setDocumentTags(docTags);
        } catch (err) {
            setError('Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const newTag = await editorApi.createTag(vaultId, newTagName.trim(), selectedColor);
            setVaultTags([...vaultTags, newTag]);
            await editorApi.addTagToDocument(documentId, newTag.id);
            setDocumentTags([...documentTags, newTag]);
            
            setNewTagName('');
            setSelectedColor(DEFAULT_COLORS[0]);
            
            onUpdate?.();
        } catch (err: any) {
            setError(err.message || 'Failed to create tag');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTag = async (tag: Tag) => {
        const isAssigned = documentTags.some(t => t.id === tag.id);
        
        try {
            setLoading(true);
            setError(null);
            if (isAssigned) {
                await editorApi.removeTagFromDocument(documentId, tag.id);
                setDocumentTags(documentTags.filter(t => t.id !== tag.id));
            } else {
                await editorApi.addTagToDocument(documentId, tag.id);
                setDocumentTags([...documentTags, tag]);
            }
            onUpdate?.();
        } catch (err: any) {
            
            setError(err.message || 'Failed to update tag');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTag = async (tagId: string) => {
        if (!confirm('Delete this tag? It will be removed from all documents.')) return;

        try {
            setLoading(true);
            setError(null);
            await editorApi.deleteTag(tagId);
            setVaultTags(vaultTags.filter(t => t.id !== tagId));
            setDocumentTags(documentTags.filter(t => t.id !== tagId));
        } catch (err: any) {
            setError(err.message || 'Failed to delete tag');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Manage Tags</h2>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Create New Tag */}
                <form onSubmit={handleCreateTag} className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">Create New Tag</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            placeholder="Tag name"
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !newTagName.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Create
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {DEFAULT_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    selectedColor === color ? 'border-white scale-110' : 'border-white/20 hover:border-white/40'
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </form>

                {/* Available Tags */}
                <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">Available Tags</label>
                    {loading && vaultTags.length === 0 ? (
                        <div className="text-center py-8 text-white/40">Loading...</div>
                    ) : vaultTags.length === 0 ? (
                        <div className="text-center py-8 text-white/40">No tags yet. Create one above!</div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {vaultTags.map(tag => {
                                const isAssigned = documentTags.some(t => t.id === tag.id);
                                return (
                                    <div
                                        key={tag.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                    >
                                        <button
                                            onClick={() => handleToggleTag(tag)}
                                            disabled={loading}
                                            className="flex items-center gap-3 flex-1 text-left disabled:opacity-50"
                                        >
                                            <span
                                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                                    isAssigned ? 'ring-2 ring-white/30' : ''
                                                }`}
                                                style={{ backgroundColor: tag.color }}
                                            >
                                                {isAssigned && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </span>
                                            <span className="text-sm text-white font-medium">{tag.name}</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTag(tag.id);
                                            }}
                                            disabled={loading}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm px-2 py-1 transition-all disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
