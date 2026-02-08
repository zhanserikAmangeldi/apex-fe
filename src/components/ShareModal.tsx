import React, { useState } from 'react';
import { GradientButton } from './ui/Button';
import { editorApi } from '../services/editorApi';

interface ShareModalProps {
    type: 'vault' | 'document';
    id: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ type, id, onClose, onSuccess }) => {
    const [emailOrUserId, setEmailOrUserId] = useState('');
    const [permission, setPermission] = useState<'read' | 'write' | 'admin'>('read');
    const [loading, setLoading] = useState(false);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [showCollaborators, setShowCollaborators] = useState(false);

    const handleShare = async () => {
        if (!emailOrUserId) {
            alert('Please enter an email or user ID');
            return;
        }

        setLoading(true);
        try {
            if (type === 'vault') {
                await editorApi.shareVault(id, emailOrUserId, permission);
            } else {
                await editorApi.shareDocument(id, emailOrUserId, permission);
            }
            alert('Shared successfully!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to share:', error);
            alert('Failed to share');
        } finally {
            setLoading(false);
        }
    };

    const loadCollaborators = async () => {
        if (type !== 'document') return;
        
        try {
            const data = await editorApi.getDocumentCollaborators(id);
            setCollaborators(data);
            setShowCollaborators(true);
        } catch (error) {
            console.error('Failed to load collaborators:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-10 w-full max-w-xl">
                <h2 className="text-white text-3xl font-bold mb-8">
                    Share {type === 'vault' ? 'Vault' : 'Document'}
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="text-white/80 text-base block mb-3 font-medium">Email or User ID</label>
                        <input
                            type="text"
                            value={emailOrUserId}
                            onChange={(e) => setEmailOrUserId(e.target.value)}
                            placeholder="Enter email (e.g., user@example.com) or UUID"
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-base placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-white/80 text-base block mb-3 font-medium">Permission</label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as any)}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-base cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <option value="read">Read Only</option>
                            <option value="write">Read & Write</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {type === 'document' && (
                        <button
                            onClick={loadCollaborators}
                            className="text-purple-400 hover:text-purple-300 text-base font-medium"
                        >
                            View Collaborators
                        </button>
                    )}

                    {showCollaborators && (
                        <div className="max-h-48 overflow-y-auto space-y-3">
                            {collaborators.map((collab, idx) => (
                                <div key={idx} className="p-4 bg-white/5 rounded-xl text-base">
                                    <p className="text-white font-mono">User ID: {collab.user_id}</p>
                                    <p className="text-white/60 capitalize mt-1">{collab.permission}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4 pt-6">
                        <GradientButton onClick={handleShare} disabled={loading} className="flex-1 py-4 text-lg">
                            {loading ? 'Sharing...' : 'Share'}
                        </GradientButton>
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
