'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { auditAPI } from '@/lib/api';
import {
    Search, LogIn, LogOut, Upload, Download,
    Trash2, Pencil, Eye, Plus, ScrollText,
} from 'lucide-react';

function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function getActionIcon(action) {
    if (!action) return <Pencil size={15} strokeWidth={1.8} />;
    const lower = action.toLowerCase();
    if (lower.includes('login')) return <LogIn size={15} strokeWidth={1.8} />;
    if (lower.includes('logout')) return <LogOut size={15} strokeWidth={1.8} />;
    if (lower.includes('upload')) return <Upload size={15} strokeWidth={1.8} />;
    if (lower.includes('download')) return <Download size={15} strokeWidth={1.8} />;
    if (lower.includes('delete')) return <Trash2 size={15} strokeWidth={1.8} />;
    if (lower.includes('create')) return <Plus size={15} strokeWidth={1.8} />;
    if (lower.includes('update')) return <Pencil size={15} strokeWidth={1.8} />;
    if (lower.includes('view')) return <Eye size={15} strokeWidth={1.8} />;
    return <Pencil size={15} strokeWidth={1.8} />;
}

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadLogs(); }, []);

    const loadLogs = async () => {
        try {
            const res = await auditAPI.list();
            const data = res.data.results || res.data;
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) { console.error('Failed to load audit logs:', err); }
        finally { setLoading(false); }
    };

    const filtered = logs.filter((log) =>
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.ip_address?.includes(search)
    );

    return (
        <AppLayout>
            <div className="page-header animate-in">
                <h1>Audit Log</h1>
                <p>Track all activity and security events</p>
            </div>

            <div className="toolbar animate-in">
                <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
                    <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
                    <input type="text" className="form-input" placeholder="Search by action or IP..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
                    {filtered.length} events
                </span>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state animate-in">
                    <ScrollText size={40} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <h3>No logs found</h3>
                    <p>{search ? 'Try a different search' : 'Activity will appear here as you use the app'}</p>
                </div>
            ) : (
                <div className="card animate-in">
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}></th>
                                    <th>Action</th>
                                    <th>IP Address</th>
                                    <th>Details</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
                                            {getActionIcon(log.action)}
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-100)' }}>{log.action}</td>
                                        <td>
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', background: 'var(--surface-0)', padding: '3px 8px', borderRadius: 4 }}>
                                                {log.ip_address || '—'}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.details && Object.keys(log.details).length > 0
                                                ? JSON.stringify(log.details).substring(0, 50) + '...'
                                                : '—'}
                                        </td>
                                        <td>
                                            <div style={{ whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: 500, color: 'var(--text-200)', fontSize: '0.84rem' }}>{timeAgo(log.timestamp)}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-500)' }}>{new Date(log.timestamp).toLocaleString()}</div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
