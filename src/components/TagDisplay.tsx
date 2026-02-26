import React, { useState, useEffect } from 'react';
import { editorApi } from '../services/editorApi';
import type { Tag } from '../types/editor';

interface TagDisplayProps {
    documentId: string;
    onManageTags?: () => void;
    refreshKey?: number;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({ documentId, onManageTags, refreshKey }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTags();
    }, [documentId, refreshKey]);

    const loadTags = async () => {
        try {
            setLoading(true);
            const docTags = await editorApi.getDocumentTags(documentId);
            setTags(docTags);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-white/40 text-xs">Loading tags...</div>;
    if (tags.length === 0 && !onManageTags) return null;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {tags.length === 0 && onManageTags && (
                <span className="text-white/40 text-xs">No tags yet</span>
            )}
            {tags.map(tag => (
                <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                >
                    {tag.name}
                </span>
            ))}
            {onManageTags && (
                <button
                    onClick={onManageTags}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-white/30 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                    + Tag
                </button>
            )}
        </div>
    );
};
