'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { secretsAPI } from '@/lib/api';
import {
    Search, Plus, Lock, FileText, Key, Package,
    Copy, Pencil, Trash2, X,
} from 'lucide-react';

const typeConfig = {
    PASSWORD: { icon: Lock, badge: 'purple', label: 'Password' },
    NOTE: { icon: FileText, badge: 'blue', label: 'Secure Note' },
    API_KEY: { icon: Key, badge: 'orange', label: 'API Key' },
    OTHER: { icon: Package, badge: 'cyan', label: 'Other' },
};

export default function SecretsPage() {
    const [secrets, setSecrets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', type: 'PASSWORD', encrypted_payload: '' });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');

    const loadSecrets = useCallback(async () => {
        try {
            const res = await secretsAPI.list();
            const data = res.data.results || res.data;
            setSecrets(Array.isArray(data) ? data : []);
        } catch (err) { console.error('Failed to load secrets:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadSecrets(); }, [loadSecrets]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type }); setTimeout(() => setToast(null), 3000);
    };

    const openCreate = () => { setEditing(null); setForm({ title: '', type: 'PASSWORD', encrypted_payload: '' }); setShowModal(true); };
    const openEdit = (secret) => { setEditing(secret); setForm({ title: secret.title, type: secret.type, encrypted_payload: secret.encrypted_payload }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.encrypted_payload) { showToast('Please fill in all fields', 'error'); return; }
        setSubmitting(true);
        try {
            if (editing) { await secretsAPI.update(editing.id, form); showToast('Secret updated'); }
            else { await secretsAPI.create(form); showToast('Secret created'); }
            setShowModal(false); loadSecrets();
        } catch (err) { showToast(err.response?.data?.detail || 'Operation failed', 'error'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id, title) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try { await secretsAPI.delete(id); showToast('Secret deleted'); loadSecrets(); }
        catch { showToast('Delete failed', 'error'); }
    };

    const copyPayload = (payload) => { navigator.clipboard.writeText(payload); showToast('Copied to clipboard'); };

    const filtered = secrets.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <AppLayout>
            <div className="page-header animate-in">
                <h1>Secrets Vault</h1>
                <p>Securely manage your passwords, notes, and API keys</p>
            </div>

            <div className="toolbar animate-in">
                <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
                    <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
                    <input type="text" className="form-input" placeholder="Search secrets..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={16} strokeWidth={2} /> New Secret
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state animate-in">
                    <Key size={40} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <h3>No secrets found</h3>
                    <p>{search ? 'Try a different search' : 'Create your first secret'}</p>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Secret</button>
                </div>
            ) : (
                <div className="content-grid animate-in">
                    {filtered.map((secret) => {
                        const config = typeConfig[secret.type] || typeConfig.OTHER;
                        const Icon = config.icon;
                        return (
                            <div className="secret-card" key={secret.id}>
                                <div className="secret-header">
                                    <div className="secret-title">
                                        <Icon size={16} strokeWidth={1.8} />
                                        <span>{secret.title}</span>
                                    </div>
                                    <span className={`badge badge-${config.badge}`}>{config.label}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-500)', marginBottom: 14 }}>
                                    Created {new Date(secret.created_at).toLocaleDateString()}
                                    {secret.updated_at !== secret.created_at && (
                                        <> · Updated {new Date(secret.updated_at).toLocaleDateString()}</>
                                    )}
                                </div>
                                <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-500)', marginBottom: 14, wordBreak: 'break-all', maxHeight: 60, overflow: 'hidden' }}>
                                    {'•'.repeat(Math.min(30, secret.encrypted_payload.length))}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => copyPayload(secret.encrypted_payload)}>
                                        <Copy size={13} /> Copy
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(secret)}>
                                        <Pencil size={13} /> Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(secret.id, secret.title)} style={{ marginLeft: 'auto' }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Secret' : 'New Secret'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label>Title</label><input type="text" className="form-input" placeholder="e.g., Gmail Password" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                                <div className="form-group"><label>Type</label><select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PASSWORD">Password</option><option value="NOTE">Secure Note</option><option value="API_KEY">API Key</option><option value="OTHER">Other</option></select></div>
                                <div className="form-group"><label>Payload / Content</label><textarea className="form-input" rows={4} placeholder="Enter the secret content..." value={form.encrypted_payload} onChange={(e) => setForm({ ...form, encrypted_payload: e.target.value })} style={{ resize: 'vertical' }} /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
        </AppLayout>
    );
}
