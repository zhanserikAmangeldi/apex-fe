import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GradientButton } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/UseAuth';
import { useDocuments } from '../hooks/useDocuments';
import { TiptapEditor } from '../components/TiptapEditor';
import type { TiptapEditorRef } from '../components/TiptapEditor';
import { ShareModal } from '../components/ShareModal';
import { AttachmentManager } from '../components/AttachmentManager';
import { FileTree } from '../components/FileTree';
import { editorApi } from '../services/editorApi';
import { isPreviewableFile, getMimeType, isImageFile, isVideoFile, isPdfFile } from '../utils/fileIcons';
import type { AppDocument, Vault } from '../types/editor';
import '../components/FileTree.css';

export const WorkspacePage: React.FC = () => {
    const { vaultId } = useParams<{ vaultId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const editorRef = useRef<TiptapEditorRef>(null);

    const [selectedDoc, setSelectedDoc] = useState<AppDocument | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [vault, setVault] = useState<Vault | null>(null);
    const [previewFile, setPreviewFile] = useState<{ url: string; filename: string; mimeType: string } | null>(null);
    const [zoom, setZoom] = useState(100);

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

    const handleSelectDocument = async (doc: AppDocument) => {
        if (!doc.is_folder) {
            setSelectedDoc(doc);
            setPreviewFile(null); // Reset preview
            setZoom(100); // Reset zoom
            
            // Check if document has attachments
            try {
                const attachments = await editorApi.getDocumentAttachments(doc.id);
                
                // If document has a previewable attachment with same name, prepare preview
                if (attachments.length > 0) {
                    const mainAttachment = attachments.find((att: any) => 
                        att.filename === doc.title || isPreviewableFile(att.filename)
                    );
                    
                    if (mainAttachment && isPreviewableFile(mainAttachment.filename)) {
                        const { downloadUrl } = await editorApi.getAttachment(mainAttachment.id);
                        const token = localStorage.getItem('access_token');
                        const urlWithToken = `${downloadUrl}?token=${encodeURIComponent(token || '')}`;
                        
                        // Set preview data but don't open modal
                        setPreviewFile({
                            url: urlWithToken,
                            filename: mainAttachment.filename,
                            mimeType: getMimeType(mainAttachment.filename)
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load attachments:', error);
            }
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
    const handleZoomReset = () => setZoom(100);

    const handleDownload = async () => {
        if (!previewFile) return;
        
        try {
            const response = await fetch(previewFile.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = previewFile.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file');
        }
    };

    const handleExportMarkdown = async () => {
        if (!selectedDoc || !editorRef.current) return;
        
        try {
            // Get markdown content from editor
            const markdown = editorRef.current.getMarkdown();
            
            // Sanitize filename: remove .md extension if exists, clean name, add .md back
            let filename = selectedDoc.title;
            if (filename.endsWith('.md')) {
                filename = filename.slice(0, -3);
            }
            filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export document');
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
                        {selectedDoc && !selectedDoc.is_folder && !previewFile && (
                            <button
                                onClick={handleExportMarkdown}
                                className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export as Markdown
                            </button>
                        )}
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
                            {previewFile ? (
                                // Show inline preview instead of editor
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* Preview Header */}
                                    <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <h2 className="text-white font-medium">{previewFile.filename}</h2>
                                            <span className="text-white/40 text-sm">({previewFile.mimeType})</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Zoom controls for images and PDFs */}
                                            {(isImageFile(previewFile.filename) || isPdfFile(previewFile.filename)) && (
                                                <>
                                                    <button
                                                        onClick={handleZoomOut}
                                                        disabled={zoom <= 25}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Zoom out"
                                                    >
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                                        </svg>
                                                    </button>
                                                    
                                                    <span className="text-white/60 text-sm min-w-[60px] text-center">
                                                        {zoom}%
                                                    </span>
                                                    
                                                    <button
                                                        onClick={handleZoomIn}
                                                        disabled={zoom >= 300}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Zoom in"
                                                    >
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                                        </svg>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={handleZoomReset}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Reset zoom"
                                                    >
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>

                                                    <div className="w-px h-6 bg-white/10 mx-2" />
                                                </>
                                            )}
                                            
                                            <button
                                                onClick={handleDownload}
                                                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm transition-all flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Content */}
                                    <div className="flex-1 overflow-auto bg-gradient-to-br from-black/50 to-black/30 p-8">
                                        {isImageFile(previewFile.filename) && (
                                            <div className="flex items-center justify-center h-full">
                                                <img
                                                    src={previewFile.url}
                                                    alt={previewFile.filename}
                                                    style={{ 
                                                        transform: `scale(${zoom / 100})`,
                                                        transition: 'transform 0.2s ease-in-out',
                                                    }}
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                                />
                                            </div>
                                        )}
                                        
                                        {isVideoFile(previewFile.filename) && (
                                            <div className="flex items-center justify-center h-full">
                                                <video
                                                    src={previewFile.url}
                                                    controls
                                                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        )}
                                        
                                        {isPdfFile(previewFile.filename) && (
                                            <iframe
                                                src={previewFile.url}
                                                title={previewFile.filename}
                                                style={{ 
                                                    transform: `scale(${zoom / 100})`,
                                                    transformOrigin: 'top center',
                                                    transition: 'transform 0.2s ease-in-out',
                                                    width: `${100 / (zoom / 100)}%`,
                                                    height: `${100 / (zoom / 100)}%`,
                                                }}
                                                className="rounded-lg shadow-2xl bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Show editor for text documents
                                <TiptapEditor
                                    ref={editorRef}
                                    key={selectedDoc.id}
                                    documentId={selectedDoc.id}
                                    userName={user?.display_name || user?.username || 'Anonymous'}
                                    userColor={stableColor}
                                    readOnly={isReadOnly}
                                />
                            )}
                            
                            <div className="border-t border-white/10 p-4 bg-black/20">
                                <AttachmentManager documentId={selectedDoc.id} />
                            </div>
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