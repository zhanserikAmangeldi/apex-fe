import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TiptapEditor } from '../components/TiptapEditor';
import { AttachmentManager } from '../components/AttachmentManager';
import { ManageAccessModal } from '../components/ManageAccessModal';
import { editorApi } from '../services/editorApi';
import type { AppDocument } from '../types/editor';

export const DocumentViewPage: React.FC = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<AppDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showManageAccess, setShowManageAccess] = useState(false);

    useEffect(() => {
        if (documentId) {
            loadDocument();
        }
    }, [documentId]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            setError(null);
            const doc = await editorApi.getDocument(documentId!);
            console.log('Loaded document:', doc);
            setDocument(doc);
        } catch (err) {
            console.error('Failed to load document:', err);
            setError('Failed to load document. You may not have access to this document.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-white">Loading document...</div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || 'Document not found'}</p>
                    <button
                        onClick={() => navigate('/shared')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                        Back to Shared
                    </button>
                </div>
            </div>
        );
    }

    const isReadOnly = document.user_permission === 'read';
    const isOwner = document.user_permission === 'owner';
    const canManageAccess = isOwner || document.user_permission === 'admin';

    console.log('Document permissions:', {
        user_permission: document.user_permission,
        isOwner,
        isReadOnly,
        canManageAccess
    });

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Header */}
            <header className="bg-[#1A1A1A] border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/shared')}
                            className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <div className="h-6 w-px bg-white/20" />
                        <div>
                            <h1 className="text-white font-semibold text-lg">{document.title}</h1>
                            <p className="text-white/60 text-xs">
                                {isReadOnly ? 'Read Only' : 'Edit Mode'} • 
                                {document.user_permission && ` ${document.user_permission} access`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isReadOnly && (
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
                                Read Only
                            </span>
                        )}
                        {canManageAccess && (
                            <button
                                onClick={() => setShowManageAccess(true)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                            >
                                Manage Access
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm"
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editor */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden">
                            <TiptapEditor
                                documentId={documentId!}
                                readOnly={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Document Info */}
                        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8">
                            <h3 className="text-white font-semibold mb-6 text-xl">Document Info</h3>
                            <div className="space-y-4 text-base">
                                <div>
                                    <span className="text-white/60">Permission:</span>
                                    <span className="text-white ml-3 capitalize font-medium">
                                        {document.user_permission || 'none'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-white/60">Owner ID:</span>
                                    <span className="text-white ml-3 font-mono text-sm block mt-1">
                                        {document.owner_id}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-white/60">Created:</span>
                                    <span className="text-white ml-3">
                                        {new Date(document.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-white/60">Updated:</span>
                                    <span className="text-white ml-3">
                                        {new Date(document.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        {!isReadOnly && (
                            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8">
                                <h3 className="text-white font-semibold mb-6 text-xl">Attachments</h3>
                                <AttachmentManager documentId={documentId!} />
                            </div>
                        )}

                        {isReadOnly && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                                <p className="text-yellow-400 text-base leading-relaxed">
                                    You have read-only access to this document. 
                                    Contact the owner to request edit permissions.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Manage Access Modal */}
            {showManageAccess && (
                <ManageAccessModal
                    type="document"
                    id={documentId!}
                    onClose={() => setShowManageAccess(false)}
                />
            )}
        </div>
    );
};
