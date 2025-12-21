import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GradientButton } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/UseAuth';
import { useDocuments } from '../hooks/useDocuments';
import { TiptapEditor } from '../components/TiptapEditor';
import type { AppDocument } from '../types/editor';

export const WorkspacePage: React.FC = () => {
    const { vaultId } = useParams<{ vaultId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [selectedDoc, setSelectedDoc] = useState<AppDocument | null>(null);
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const {
        documents,
        loading,
        createDocument,
        deleteDocument,
    } = useDocuments(vaultId);


    const stableColor = useMemo(() => {
        const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    const buildTree = (items: AppDocument[], parentId: string | null = null): AppDocument[] => {
        return items
            .filter(i => i.parent_id === parentId)
            .map(i => ({
                ...i,
                children: i.is_folder ? buildTree(items, i.id) : []
            }));
    };

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
                                    {documents.filter(d => !d.is_folder).length} documents
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-2 rounded-lg bg-white/10">
                            <span className="text-white text-sm">
                                {user?.display_name || user?.username}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside
                    className={`flex-shrink-0 ${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 
                    backdrop-blur-sm bg-black/20 border-r border-white/10 flex flex-col overflow-hidden`}
                >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Files</h3>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {buildTree(documents).map(doc => (
                            <FileTreeItem
                                key={doc.id}
                                item={doc}
                                level={0}
                                isOpen={openFolders[doc.id]}
                                onToggle={() => setOpenFolders(p => ({ ...p, [doc.id]: !p[doc.id] }))}
                                onSelect={handleSelectDocument}
                                onDelete={handleDeleteDocument}
                                isSelected={selectedDoc?.id === doc.id}
                                openFolders={openFolders}
                                setOpenFolders={setOpenFolders}
                            />
                        ))}
                    </div>
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
                        <TiptapEditor
                            key={selectedDoc.id}
                            documentId={selectedDoc.id}
                            userName={user?.display_name || user?.username || 'Anonymous'}
                            userColor={stableColor}
                        />
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
        </div>
    );
};

const FileTreeItem: React.FC<{
    item: AppDocument & { children?: AppDocument[] };
    level: number;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (doc: AppDocument) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
    openFolders: Record<string, boolean>;
    setOpenFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}> = ({ item, level, isOpen, onToggle, onSelect, onDelete, isSelected, openFolders, setOpenFolders }) => {
    return (
        <div>
            <div
                onClick={() => item.is_folder ? onToggle() : onSelect(item)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                ${isSelected
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/50'
                    : 'hover:bg-white/10'}`}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                {item.is_folder && (
                    <svg
                        className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
                {!item.is_folder && <span className="w-4" />}

                <span className="text-lg flex-shrink-0">
                    {item.icon || (item.is_folder ? '📁' : '📄')}
                </span>

                <span className={`flex-1 truncate text-sm ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                    {item.title}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {item.is_folder && isOpen && item.children && (
                <div>
                    {item.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            isOpen={openFolders[child.id] || false}
                            onToggle={() => setOpenFolders(p => ({ ...p, [child.id]: !p[child.id] }))}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            isSelected={isSelected}
                            openFolders={openFolders}
                            setOpenFolders={setOpenFolders}
                        />
                    ))}
                </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="max-w-md w-full">
                <GlassCard>
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6">Create New Item</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setForm(p => ({ ...p, is_folder: false }))}
                                    className={`p-4 rounded-xl transition-all ${!form.is_folder ? 'bg-purple-500/20 ring-2 ring-purple-500/50' : 'bg-white/10'}`}
                                >
                                    <p className="text-white font-medium text-sm">Document</p>
                                </button>
                                <button
                                    onClick={() => setForm(p => ({ ...p, is_folder: true }))}
                                    className={`p-4 rounded-xl transition-all ${form.is_folder ? 'bg-blue-500/20 ring-2 ring-blue-500/50' : 'bg-white/10'}`}
                                >
                                    <p className="text-white font-medium text-sm">Folder</p>
                                </button>
                            </div>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="Name..."
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none"
                                autoFocus
                            />
                            <div className="flex gap-3 pt-2">
                                <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white">Cancel</button>
                                <GradientButton variant="blue" onClick={() => form.title.trim() && onSubmit(form)} className="flex-1">Create</GradientButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};