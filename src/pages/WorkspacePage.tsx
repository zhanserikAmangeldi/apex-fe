import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GradientButton } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/UseAuth';
import { useDocuments } from '../hooks/useDocuments';
import { TiptapEditor } from '../components/TiptapEditor';
import { ShareModal } from '../components/ShareModal';
import { AttachmentManager } from '../components/AttachmentManager';
import { FileTree } from '../components/FileTree';
import { editorApi } from '../services/editorApi';
import type { AppDocument, Vault } from '../types/editor';
import '../components/FileTree.css';

export const WorkspacePage: React.FC = () => {
    const { vaultId } = useParams<{ vaultId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [selectedDoc, setSelectedDoc] = useState<AppDocument | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [vault, setVault] = useState<Vault | null>(null);

    const {
        documents,
        loading,
        createDocument,
        deleteDocument,
        updateDocument,
        moveDocument,
        refetch,
    } = useDocuments(vaultId);

    // Load vault info to check permissions
    useEffect(() => {
        const loadVault = async () => {
            if (vaultId) {
                try {
                    const vaultData = await editorApi.getVault(vaultId);
                    setVault(vaultData);
                    console.log('Vault loaded:', vaultData);
                } catch (error) {
                    console.error('Failed to load vault:', error);
                }
            }
        };
        loadVault();
    }, [vaultId]);


    const stableColor = useMemo(() => {
        const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    // Determine if user has read-only access to selected document
    const isReadOnly = useMemo(() => {
        // If no document selected, use vault permissions
        if (!selectedDoc) {
            return vault?.user_permission === 'read';
        }
        
        // If document has user_permission, use it (direct document permissions or inherited from vault)
        if (selectedDoc.user_permission) {
            return selectedDoc.user_permission === 'read';
        }
        
        // Fallback to vault permissions
        return vault?.user_permission === 'read';
    }, [vault, selectedDoc]);

    console.log('Workspace permissions:', {
        vaultId,
        vault_permission: vault?.user_permission,
        selectedDocId: selectedDoc?.id,
        doc_permission: selectedDoc?.user_permission,
        isReadOnly
    });

    const handleSelectDocument = (doc: AppDocument) => {
        if (!doc.is_folder) {
            setSelectedDoc(doc);
        }
    };

    const handleCreateDocument = async (data: { title: string; is_folder: boolean }) => {
        try {
            await createDocument({
                title: data.title,
                is_folder: data.is_folder,
                parent_id: selectedDoc?.is_folder ? selectedDoc.id : selectedDoc?.parent_id || null,
            });
            setShowCreateModal(false);
        } catch (err) {
            alert('Failed to create item: ' + err);
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDocument(id);
                if (selectedDoc?.id === id) {
                    setSelectedDoc(null);
                }
            } catch (err) {
                alert('Failed to delete item: ' + err);
            }
        }
    };

    const handleMoveDocument = async (docId: string, newParentId: string | null) => {
        try {
            await moveDocument(docId, newParentId);
        } catch (err) {
            alert('Failed to move item: ' + err);
        }
    };

    const handleRenameDocument = async (id: string, newTitle: string) => {
        try {
            await updateDocument(id, { title: newTitle });
        } catch (err) {
            alert('Failed to rename item: ' + err);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#0F0F0F] flex items-center justify-center">
                <div className="text-white/60">Loading workspace...</div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0F0F0F] flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-6 py-4 backdrop-blur-sm bg-black/40 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>

                        <div className="h-8 w-px bg-white/20" />

                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10">
                            <div>
                                <h2 className="text-white font-semibold">Workspace</h2>
                                <p className="text-white/60 text-xs">
                                    {(documents || []).filter(d => !d.is_folder).length} documents
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedDoc && !selectedDoc.is_folder && (
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/profile')}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <span className="text-white text-sm">
                                {user?.display_name || user?.username}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside
                    className={`flex-shrink-0 ${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 
                    backdrop-blur-sm bg-black/20 border-r border-white/10 flex flex-col overflow-hidden`}
                >
                    {!sidebarCollapsed && (
                        <FileTree
                            documents={documents}
                            selectedDoc={selectedDoc}
                            vaultId={vaultId!}
                            onSelect={handleSelectDocument}
                            onDelete={isReadOnly ? () => {} : handleDeleteDocument}
                            onMove={isReadOnly ? () => {} : handleMoveDocument}
                            onRename={isReadOnly ? () => {} : handleRenameDocument}
                            onCreate={isReadOnly ? () => {} : () => setShowCreateModal(true)}
                            onRefresh={refetch}
                        />
                    )}
                </aside>

                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex-shrink-0 w-6 backdrop-blur-sm bg-black/20 border-r border-white/10
                    hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                    <svg
                        className={`w-4 h-4 text-white transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <main className="flex-1 flex flex-col overflow-hidden bg-[#0F0F0F]">
                    {selectedDoc && !selectedDoc.is_folder ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <TiptapEditor
                                key={selectedDoc.id}
                                documentId={selectedDoc.id}
                                userName={user?.display_name || user?.username || 'Anonymous'}
                                userColor={stableColor}
                                readOnly={isReadOnly}
                            />
                            {!isReadOnly && (
                                <div className="border-t border-white/10 p-4 bg-black/20">
                                    <AttachmentManager documentId={selectedDoc.id} />
                                </div>
                            )}
                            {isReadOnly && (
                                <div className="border-t border-white/10 p-4 bg-yellow-500/10">
                                    <p className="text-yellow-400 text-sm text-center">
                                        You have read-only access to this vault
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
                                    📄
                                </div>
                                <h3 className="text-white/60 text-lg font-medium mb-2">No document selected</h3>
                                <p className="text-white/40 text-sm">Select a file from the sidebar to start collaborating</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showCreateModal && (
                <CreateDocumentModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateDocument}
                />
            )}

            {showShareModal && selectedDoc && (
                <ShareModal
                    type="document"
                    id={selectedDoc.id}
                    onClose={() => setShowShareModal(false)}
                    onSuccess={() => {
                        setShowShareModal(false);
                    }}
                />
            )}
        </div>
    );
};



const CreateDocumentModal: React.FC<{
    onClose: () => void;
    onSubmit: (data: { title: string; is_folder: boolean }) => void;
}> = ({ onClose, onSubmit }) => {
    const [form, setForm] = useState({ title: '', is_folder: false });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="max-w-xl w-full">
                <GlassCard>
                    <div className="p-10">
                        <h2 className="text-3xl font-semibold text-white mb-8">Создать новый элемент</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setForm(p => ({ ...p, is_folder: false }))}
                                    className={`p-6 rounded-2xl transition-all ${
                                        !form.is_folder 
                                            ? 'bg-purple-500/20 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20' 
                                            : 'bg-white/10 hover:bg-white/15'
                                    }`}
                                >
                                    <div className="text-5xl mb-3">📄</div>
                                    <p className="text-white font-medium text-lg">Документ</p>
                                    <p className="text-white/60 text-sm mt-2">Файл для редактирования</p>
                                </button>
                                <button
                                    onClick={() => setForm(p => ({ ...p, is_folder: true }))}
                                    className={`p-6 rounded-2xl transition-all ${
                                        form.is_folder 
                                            ? 'bg-blue-500/20 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20' 
                                            : 'bg-white/10 hover:bg-white/15'
                                    }`}
                                >
                                    <div className="text-5xl mb-3">📁</div>
                                    <p className="text-white font-medium text-lg">Папка</p>
                                    <p className="text-white/60 text-sm mt-2">Для организации файлов</p>
                                </button>
                            </div>
                            <div>
                                <label className="block text-white/80 text-base mb-3 font-medium">
                                    Название {form.is_folder ? 'папки' : 'документа'}
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder={form.is_folder ? "Моя папка..." : "Мой документ..."}
                                    className="w-full px-6 py-4 text-lg rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && form.title.trim()) {
                                            onSubmit(form);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={onClose} 
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/10 text-white hover:bg-white/15 transition-all text-lg"
                                >
                                    Отмена
                                </button>
                                <GradientButton 
                                    variant="blue" 
                                    onClick={() => form.title.trim() && onSubmit(form)} 
                                    className="flex-1 py-4 text-lg"
                                    disabled={!form.title.trim()}
                                >
                                    Создать
                                </GradientButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};