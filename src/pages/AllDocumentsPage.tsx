import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ellipse } from '../components/ui/Ellipse';
import { Logo } from '../components/ui/Logo';
import { FileIcon } from '../components/ui/FileIcon';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/UseAuth';
import { editorApi } from '../services/editorApi';
import type { AppDocument } from '../types/editor';

export const AllDocumentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const data = await editorApi.getAllDocuments();
            setDocuments(data);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };

    const formatSize = (bytes: number | null) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
            <Ellipse className="w-96 h-96 top-0 right-0" gradient="linear-gradient(180deg, #530061 0%, #0D0A30 100%)" />
            <Ellipse className="w-72 h-72 bottom-20 left-10" gradient="linear-gradient(180deg, #190061 0%, #0A1B30 100%)" />

            <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-black/20 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Logo />
                    <div className="h-8 w-px bg-white/20" />
                    <div>
                        <h1 className="text-white font-semibold text-lg">All Documents</h1>
                        <p className="text-white/60 text-xs">Global document list</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                    >
                        <span className="text-white text-sm">
                            {user?.display_name || user?.username}
                        </span>
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-4xl font-semibold text-white mb-6">
                        All Your Documents
                    </h2>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-md px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-20 text-white/60">Loading documents...</div>
                ) : filteredDocuments.length === 0 ? (
                    <GlassCard>
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📄</div>
                            <h3 className="text-white text-xl font-semibold mb-2">
                                {searchQuery ? 'No documents found' : 'No documents yet'}
                            </h3>
                            <p className="text-white/60">
                                {searchQuery ? 'Try a different search term' : 'Create a vault and start adding documents'}
                            </p>
                        </div>
                    </GlassCard>
                ) : (
                    <div className="space-y-4">
                        {filteredDocuments.map(doc => (
                            <GlassCard key={doc.id}>
                                <div className="p-6 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                                <FileIcon
                                                    filename={doc.title}
                                                    isFolder={doc.is_folder}
                                                    customIcon={doc.icon}
                                                    size={36}
                                                    className="flex-shrink-0"
                                                />
                                            <h3 className="text-white font-semibold text-lg">{doc.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-white/60 ml-12">
                                            <span>Created: {formatDate(doc.created_at)}</span>
                                            <span>Updated: {formatDate(doc.updated_at)}</span>
                                            {doc.snapshot_size_bytes && (
                                                <span>Size: {formatSize(doc.snapshot_size_bytes)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/workspace/${doc.vault_id}`)}
                                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-all"
                                    >
                                        Open
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
