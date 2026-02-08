import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editorApi } from '../services/editorApi';
import type { Vault, AppDocument } from '../types/editor';

export const SharedWithMePage: React.FC = () => {
    const navigate = useNavigate();
    const [sharedVaults, setSharedVaults] = useState<Vault[]>([]);
    const [sharedDocuments, setSharedDocuments] = useState<AppDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSharedItems();
    }, []);

    const loadSharedItems = async () => {
        try {
            setLoading(true);
            const [vaults, documents] = await Promise.all([
                editorApi.getSharedVaults(),
                editorApi.getSharedDocuments()
            ]);
            setSharedVaults(vaults);
            setSharedDocuments(documents);
        } catch (error) {
            console.error('Failed to load shared items:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>
                
                <h1 className="text-4xl font-bold text-white mb-8">Shared with Me</h1>

                {/* Shared Vaults */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-white mb-6">Vaults</h2>
                    {sharedVaults.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                            <div className="text-5xl mb-4">📦</div>
                            <p className="text-white/60">No vaults shared with you yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sharedVaults.map((vault) => (
                                <div
                                    key={vault.id}
                                    onClick={() => navigate(`/dashboard?vault=${vault.id}`)}
                                    className="bg-white/5 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-4xl transition-transform duration-200">{vault.icon}</span>
                                        <span className="text-xs text-white/60 capitalize px-2 py-1 bg-white/10 rounded-full">
                                            {vault.user_permission}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-semibold mb-2 text-lg">{vault.name}</h3>
                                    {vault.description && (
                                        <p className="text-white/60 text-sm mb-3 line-clamp-2">{vault.description}</p>
                                    )}
                                    <div className="text-xs text-white/40">
                                        Owner ID: {vault.owner_id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Shared Documents */}
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-6">Documents</h2>
                    {sharedDocuments.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                            <div className="text-5xl mb-4">📄</div>
                            <p className="text-white/60">No documents shared with you yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sharedDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    onClick={() => navigate(`/document/${doc.id}`)}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl transition-transform duration-200">
                                            {doc.is_folder ? '📁' : '📄'}
                                        </span>
                                        <div>
                                            <h3 className="text-white font-medium text-lg">{doc.title}</h3>
                                            <p className="text-xs text-white/40 mt-1">
                                                Owner ID: {doc.owner_id}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-white/60 capitalize px-3 py-1 bg-white/10 rounded-full">
                                        {doc.user_permission}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
