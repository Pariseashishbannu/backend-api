'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { filesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    Files, FolderOpen, Star, HardDrive, LogOut, Settings,
} from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [storageStats, setStorageStats] = useState(null);
    const [fileStats, setFileStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const [storageRes, statsRes] = await Promise.allSettled([
                filesAPI.storageStats(),
                filesAPI.stats(),
            ]);
            if (storageRes.status === 'fulfilled') setStorageStats(storageRes.value.data);
            if (statsRes.status === 'fulfilled') setFileStats(statsRes.value.data);
        } catch (err) { console.error('Failed to load profile:', err); }
        finally { setLoading(false); }
    };

    const quotaGB = storageStats?.quota_gb || 10;
    const usedBytes = storageStats?.used_bytes || 0;
    const usedPercent = Math.min(100, (usedBytes / (quotaGB * 1024 * 1024 * 1024)) * 100);

    return (
        <AppLayout>
            <div className="page-header animate-in">
                <h1>Profile</h1>
                <p>Your account details and storage usage</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
                {/* User Info Card */}
                <div className="card animate-in">
                    <div className="card-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto 20px', color: 'white', boxShadow: 'var(--shadow-glow)' }}>
                            {user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-100)' }}>
                            {user?.username || 'User'}
                        </h2>
                        <p style={{ color: 'var(--text-500)', fontSize: '0.82rem', marginBottom: 24, fontFamily: "'JetBrains Mono', monospace" }}>
                            {user?.id ? user.id.substring(0, 8) + '...' : '—'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, opacity: 0.5 }}><Files size={16} /></div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-100)' }}>{fileStats?.total_files ?? '—'}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-500)' }}>Files</div>
                            </div>
                            <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, opacity: 0.5 }}><FolderOpen size={16} /></div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-100)' }}>{fileStats?.total_folders ?? '—'}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-500)' }}>Folders</div>
                            </div>
                        </div>

                        <button className="btn btn-danger" style={{ marginTop: 24, width: '100%' }} onClick={logout}>
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Storage Card */}
                <div className="card animate-in" style={{ animationDelay: '100ms' }}>
                    <div className="card-header">
                        <h3><HardDrive size={15} strokeWidth={1.8} style={{ marginRight: 8, verticalAlign: -2 }} />Storage</h3>
                        <span className="badge badge-purple">{usedPercent.toFixed(1)}% used</span>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="loading-spinner" /></div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-200)' }}>{formatBytes(usedBytes)}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-500)' }}>{quotaGB} GB</span>
                                    </div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${usedPercent}%` }} /></div>
                                </div>
                                <div style={{ fontSize: '0.85rem' }}>
                                    {[
                                        { icon: <Files size={14} />, label: 'Total Files', value: fileStats?.total_files ?? 0 },
                                        { icon: <FolderOpen size={14} />, label: 'Folders', value: fileStats?.total_folders ?? 0 },
                                        { icon: <Star size={14} />, label: 'Favorites', value: fileStats?.favorites ?? 0 },
                                        { icon: <HardDrive size={14} />, label: 'Available', value: formatBytes((quotaGB * 1024 * 1024 * 1024) - usedBytes), isSuccess: true },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                                            <span style={{ color: 'var(--text-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ display: 'flex', opacity: 0.5 }}>{item.icon}</span> {item.label}
                                            </span>
                                            <span style={{ fontWeight: 600, color: item.isSuccess ? 'var(--success)' : 'var(--text-200)' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="card animate-in" style={{ marginTop: 20, maxWidth: 900, animationDelay: '200ms' }}>
                <div className="card-header">
                    <h3><Settings size={15} strokeWidth={1.8} style={{ marginRight: 8, verticalAlign: -2 }} />Account Settings</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" className="form-input" value={user?.username || ''} readOnly style={{ opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label>Account ID</label>
                            <input type="text" className="form-input" value={user?.id || ''} readOnly style={{ opacity: 0.6, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-500)', marginTop: 8 }}>
                        Contact your administrator to update account settings.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
