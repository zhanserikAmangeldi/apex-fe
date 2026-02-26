import React, { useState, useEffect } from 'react';
import { editorApi } from '../services/editorApi';

interface Collaborator {
    user_id: string;
    permission: 'read' | 'write' | 'admin';
    created_at: string;
}

interface ManageAccessModalProps {
    type: 'vault' | 'document';
    id: string;
    onClose: () => void;
}

export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({ type, id, onClose }) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadCollaborators();
    }, []);

    const loadCollaborators = async () => {
        try {
            setLoading(true);
            let data;
            if (type === 'vault') {
                data = await editorApi.getVaultCollaborators(id);
            } else {
                data = await editorApi.getDocumentCollaborators(id);
            }
            setCollaborators(data.collaborators || data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePermission = async (userId: string, newPermission: 'read' | 'write' | 'admin') => {
        try {
            setActionLoading(userId);
            if (type === 'vault') {
                await editorApi.updateVaultPermission(id, userId, newPermission);
            } else {
                await editorApi.updateDocumentPermission(id, userId, newPermission);
            }
            await loadCollaborators();
            alert('Permission updated successfully!');
        } catch (error) {
            alert('Failed to update permission');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveAccess = async (userId: string) => {
        if (!confirm('Are you sure you want to remove access for this user?')) {
            return;
        }

        try {
            setActionLoading(userId);
            if (type === 'vault') {
                await editorApi.removeVaultAccess(id, userId);
            } else {
                await editorApi.removeDocumentAccess(id, userId);
            }
            await loadCollaborators();
            alert('Access removed successfully!');
        } catch (error) {
            alert('Failed to remove access');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-3xl font-bold">
                        Manage Access - {type === 'vault' ? 'Vault' : 'Document'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadCollaborators}
                            disabled={loading}
                            className="text-white/60 hover:text-white p-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white text-3xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-white/60 text-lg">Loading collaborators...</div>
                    </div>
                ) : collaborators.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-white/60 text-lg">No collaborators yet</div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {collaborators.map((collab) => (
                            <div
                                key={collab.user_id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-white font-medium font-mono text-base">
                                            {collab.user_id}
                                        </p>
                                        <p className="text-white/40 text-sm mt-2">
                                            Added: {new Date(collab.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Permission Selector */}
                                        <select
                                            value={collab.permission}
                                            onChange={(e) => handleUpdatePermission(
                                                collab.user_id,
                                                e.target.value as 'read' | 'write' | 'admin'
                                            )}
                                            disabled={actionLoading === collab.user_id}
                                            className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-base cursor-pointer hover:bg-white/20 transition-colors disabled:opacity-50"
                                        >
                                            <option value="read">Read</option>
                                            <option value="write">Write</option>
                                            <option value="admin">Admin</option>
                                        </select>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveAccess(collab.user_id)}
                                            disabled={actionLoading === collab.user_id}
                                            className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-base transition-colors disabled:opacity-50 font-medium"
                                        >
                                            {actionLoading === collab.user_id ? 'Removing...' : 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors text-lg font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
