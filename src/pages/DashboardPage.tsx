import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ellipse } from '../components/ui/Ellipse';
import { Logo } from '../components/ui/Logo';
import { GradientButton } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/UseAuth';
import { useVaults } from '../hooks/useVaults';
import { ShareModal } from '../components/ShareModal';
import { ManageAccessModal } from '../components/ManageAccessModal';
import type { Vault, CreateVaultRequest } from '../types/editor';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [shareVaultId, setShareVaultId] = useState<string | null>(null);
    const [manageAccessVaultId, setManageAccessVaultId] = useState<string | null>(null);

    const { vaults, loading, error, createVault } = useVaults();

    // Map hex colors to Tailwind gradients for display
    const getGradientFromColor = (hexColor: string): string => {
        const colorMap: Record<string, string> = {
            '#a855f7': 'from-purple-500 to-pink-500',
            '#3b82f6': 'from-blue-500 to-purple-500',
            '#ec4899': 'from-pink-500 to-red-500',
            '#06b6d4': 'from-blue-500 to-cyan-500',
            '#10b981': 'from-green-500 to-blue-500',
        };
        return colorMap[hexColor] || 'from-purple-500 to-pink-500';
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return d.toLocaleDateString();
    };

    const filteredVaults = (vaults || []).filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
            <Ellipse className="w-96 h-96 top-0 right-0" gradient="linear-gradient(180deg, #530061 0%, #0D0A30 100%)" />
            <Ellipse className="w-72 h-72 bottom-20 left-10" gradient="linear-gradient(180deg, #190061 0%, #0A1B30 100%)" />
            <Ellipse className="w-52 h-52 top-1/3 left-1/3" gradient="linear-gradient(180deg, #61004B 0%, #220A30 100%)" />

            <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-black/20">
                <div className="flex items-center gap-4">
                    <Logo onClick={() => navigate('/')} />
                    <div className="h-8 w-px bg-white/20" />
                    <div>
                        <h1 className="text-white font-semibold text-lg">Collaborative Editor</h1>
                        <p className="text-white/60 text-xs">Your Workspaces</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/shared')}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                    >
                        Shared with Me
                    </button>
                    <button
                        onClick={() => navigate('/documents')}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                    >
                        All Documents
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                    >
                        <span className="text-white text-sm">{user?.display_name || user?.username}</span>
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 backdrop-blur-sm mb-6">
                        <span className="text-white font-semibold">Your Vaults</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-semibold text-white mb-4">
                        Choose Your<br />Workspace
                    </h2>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search vaults..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                    </div>
                    <GradientButton
                        variant="blue"
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3"
                    >
                        + New Vault
                    </GradientButton>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-white/60">Loading your workspaces...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">Error: {error}</div>
                ) : filteredVaults.length === 0 ? (
                    <GlassCard>
                        <div className="text-center py-16">
                            <h3 className="text-white text-xl font-semibold mb-2">
                                {searchQuery ? 'No vaults found' : 'No vaults yet'}
                            </h3>
                            {!searchQuery && (
                                <GradientButton onClick={() => setShowCreateModal(true)}>
                                    Create Your First Vault
                                </GradientButton>
                            )}
                        </div>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVaults.map(vault => (
                            <VaultCard
                                key={vault.id}
                                vault={vault}
                                gradient={getGradientFromColor(vault.color)}
                                onClick={() => navigate(`/workspace/${vault.id}`)}
                                onShare={(e) => {
                                    e.stopPropagation();
                                    setShareVaultId(vault.id);
                                }}
                                onManageAccess={(e) => {
                                    e.stopPropagation();
                                    setManageAccessVaultId(vault.id);
                                }}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                )}
            </main>

            {showCreateModal && (
                <CreateVaultModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={createVault}
                />
            )}

            {shareVaultId && (
                <ShareModal
                    type="vault"
                    id={shareVaultId}
                    onClose={() => setShareVaultId(null)}
                    onSuccess={() => setShareVaultId(null)}
                />
            )}

            {manageAccessVaultId && (
                <ManageAccessModal
                    type="vault"
                    id={manageAccessVaultId}
                    onClose={() => setManageAccessVaultId(null)}
                />
            )}
        </div>
    );
};

const VaultCard: React.FC<{
    vault: Vault;
    gradient: string;
    onClick: () => void;
    onShare: (e: React.MouseEvent) => void;
    onManageAccess: (e: React.MouseEvent) => void;
    formatDate: (date: string) => string;
}> = ({ vault, gradient, onClick, onShare, onManageAccess, formatDate }) => {
    const isOwner = vault.user_permission === 'owner';
    const canManageAccess = isOwner || vault.user_permission === 'admin';

    console.log('VaultCard permissions:', {
        vaultId: vault.id,
        vaultName: vault.name,
        user_permission: vault.user_permission,
        isOwner,
        canManageAccess
    });

    return (
        <div onClick={onClick} className="group cursor-pointer">
            <GlassCard>
                <div className="relative">
                    <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${gradient} opacity-20 rounded-t-2xl`} />
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-lg transition-transform duration-300`}>
                                {vault.icon}
                            </div>
                            <div className="flex gap-2">
                                {canManageAccess && (
                                    <button
                                        onClick={onManageAccess}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-500/20 rounded-lg transition-all"
                                        title="Manage Access"
                                    >
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    onClick={onShare}
                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-purple-500/20 rounded-lg transition-all"
                                    title="Share"
                                >
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <h3 className="text-white font-semibold text-xl mb-2 group-hover:text-purple-300 transition-colors">
                            {vault.name}
                        </h3>
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">
                            {vault.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-white/50">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{vault.document_count} docs</span>
                            </div>
                            <span>Updated {formatDate(vault.updated_at)}</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

const CreateVaultModal: React.FC<{
    onClose: () => void,
    onSubmit: (data: CreateVaultRequest) => Promise<any>
}> = ({ onClose, onSubmit }) => {
    const [form, setForm] = useState<CreateVaultRequest>({
        name: '',
        description: '',
        icon: '📁',
        color: '#a855f7'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const icons = ['📁', '📝', '💼', '🎓', '🏠', '💡', '🎨', '🔬', '📚', '🎯'];
    const colors = [
        { name: 'Purple', value: '#a855f7', gradient: 'from-purple-500 to-pink-500' },
        { name: 'Blue', value: '#3b82f6', gradient: 'from-blue-500 to-purple-500' },
        { name: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-red-500' },
        { name: 'Cyan', value: '#06b6d4', gradient: 'from-blue-500 to-cyan-500' },
        { name: 'Green', value: '#10b981', gradient: 'from-green-500 to-blue-500' },
    ];

    const handleSubmit = async () => {
        if (form.name.trim()) {
            try {
                setIsSubmitting(true);
                await onSubmit(form);
                onClose();
            } catch (err) {
                alert('Failed to create vault, ' + err);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="max-w-2xl w-full">
                <GlassCard className="max-w-4xl">
                    <div className="p-8 sm:p-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-semibold text-white">Create New Vault</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-white/80 text-sm font-medium mb-3">Icon</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {icons.map(icon => (
                                            <button
                                                key={icon}
                                                onClick={() => setForm(p => ({ ...p, icon }))}
                                                className={`w-10 h-10 text-xl rounded-lg transition-all ${
                                                    form.icon === icon ? 'bg-white/30 ring-2 ring-purple-500' : 'bg-white/10 hover:bg-white/20'
                                                }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/80 text-sm font-medium mb-3">Color Theme</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {colors.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setForm(p => ({ ...p, color: c.value }))}
                                                className={`h-8 rounded-md bg-gradient-to-r ${c.gradient} border-2 ${form.color === c.value ? 'border-white' : 'border-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 text-sm font-medium mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={onClose} className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    Cancel
                                </button>
                                <GradientButton
                                    variant="blue"
                                    onClick={handleSubmit}
                                    className="flex-1"
                                    disabled={!form.name.trim() || isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Vault'}
                                </GradientButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};