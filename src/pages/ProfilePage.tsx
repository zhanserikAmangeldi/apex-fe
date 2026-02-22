import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ellipse } from '../components/ui/Ellipse';
import { Logo } from '../components/ui/Logo';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/UseAuth';
import { api } from '../services/api';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [showSessions, setShowSessions] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    const [formData, setFormData] = useState({
        display_name: user?.display_name || '',
        bio: user?.bio || '',
        status: user?.status || 'active',
    });

    useEffect(() => {
        loadAvatar();
        
        // Cleanup function to revoke blob URL when component unmounts
        return () => {
            if (avatarUrl) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, []);

    const loadAvatar = async () => {
        try {
            // Очищаем старый blob URL чтобы освободить память
            if (avatarUrl) {
                URL.revokeObjectURL(avatarUrl);
            }
            
            const blob = await api.getAvatar();
            const url = URL.createObjectURL(blob);
            setAvatarUrl(url);
        } catch (error: any) {
            // 400, 401, or 404 means no avatar exists yet or not authorized, which is fine
            // Just show the default avatar (user's initial)
            const status = error?.response?.status;
            if (status === 400 || status === 401 || status === 404) {
                setAvatarUrl(null);
            } else {
                console.error('Failed to load avatar:', error);
            }
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        try {
            setIsUploadingAvatar(true);
            await api.uploadAvatar(file);
            // Wait a bit for the server to process
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadAvatar();
        } catch (error: any) {
            console.error('Failed to upload avatar:', error);
            const message = error?.message || 'Failed to upload avatar';
            alert(message);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await api.updateProfile(formData);
            setIsEditing(false);
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile');
        }
    };

    const loadSessions = async () => {
        try {
            const data = await api.getActiveSessions();
            console.log('Sessions data:', data);
            // API возвращает объект с полем sessions
            if (data && Array.isArray(data.sessions)) {
                setSessions(data.sessions);
            } else {
                console.error('Sessions data is not valid:', data);
                setSessions([]);
            }
            setShowSessions(true);
        } catch (error) {
            console.error('Failed to load sessions:', error);
            setSessions([]);
            setShowSessions(true);
            alert('Failed to load sessions');
        }
    };

    const handleLogoutAll = async () => {
        if (!confirm('Are you sure you want to logout from all devices?')) return;
        
        try {
            await api.logoutAll();
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout from all devices:', error);
            alert('Failed to logout from all devices');
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
            <Ellipse className="w-96 h-96 top-0 right-0" gradient="linear-gradient(180deg, #530061 0%, #0D0A30 100%)" />
            <Ellipse className="w-72 h-72 bottom-20 left-10" gradient="linear-gradient(180deg, #190061 0%, #0A1B30 100%)" />

            <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-black/20 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Logo onClick={() => navigate('/')} />
                    <div className="h-8 w-px bg-white/20" />
                    <div>
                        <h1 className="text-white font-semibold text-lg">Profile Settings</h1>
                        <p className="text-white/60 text-xs">Manage your account</p>
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
                        onClick={logout}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="relative z-10 px-6 py-12 max-w-4xl mx-auto">
                <GlassCard className="p-6">
                    <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-3xl font-bold">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <label className={`cursor-pointer ${isUploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploadingAvatar}
                                />
                                <span className="text-purple-400 hover:text-purple-300 text-xs">
                                    {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                                </span>
                            </label>
                        </div>

                        <div className="flex-1">
                            <div className="mb-4">
                                <h2 className="text-white text-xl font-bold mb-1">{user?.username}</h2>
                                <p className="text-white/60 text-sm">{user?.email}</p>
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-white/80 text-xs block mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.display_name}
                                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/80 text-xs block mb-1">Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm h-20 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/80 text-xs block mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                        >
                                            <option value="active">Active</option>
                                            <option value="away">Away</option>
                                            <option value="busy">Busy</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm transition-all"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-white/60 text-xs">Display Name</p>
                                        <p className="text-white text-sm">{user?.display_name || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">Bio</p>
                                        <p className="text-white text-sm">{user?.bio || 'No bio yet'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">Status</p>
                                        <p className="text-white text-sm capitalize">{user?.status || 'active'}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm transition-all mt-2"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 mt-4">
                    <h3 className="text-white text-lg font-bold mb-4">Session Management</h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={loadSessions}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm transition-all"
                            >
                                View Active Sessions
                            </button>
                            <button
                                onClick={handleLogoutAll}
                                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm transition-colors"
                            >
                                Logout All Devices
                            </button>
                        </div>

                        {showSessions && (
                            <div className="space-y-2">
                                {sessions.length === 0 ? (
                                    <p className="text-white/60 text-sm">No active sessions</p>
                                ) : (
                                    sessions.map((session) => (
                                        <div 
                                            key={session.id} 
                                            className={`p-3 rounded-lg ${
                                                session.is_current 
                                                    ? 'bg-purple-500/20 border border-purple-500/50' 
                                                    : 'bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-white text-sm">
                                                        {session.user_agent || 'Unknown device'}
                                                        {session.is_current && (
                                                            <span className="ml-2 text-xs text-purple-400 font-medium">
                                                                (Current)
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-white/60 text-xs mt-1">
                                                        {session.ip_address || 'Unknown IP'}
                                                    </p>
                                                    <p className="text-white/40 text-xs mt-1">
                                                        Created: {new Date(session.created_at).toLocaleString()}
                                                    </p>
                                                    <p className="text-white/40 text-xs">
                                                        Expires: {new Date(session.expires_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </main>
        </div>
    );
};
