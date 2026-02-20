'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { integrationsAPI } from '@/lib/api';
import {
    Cloud, Camera, RefreshCw, Unplug, X, Lock,
    Loader2, CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';

export default function IntegrationsPage() {
    const [icloudStatus, setIcloudStatus] = useState('disconnected');
    const [googleStatus, setGoogleStatus] = useState('disconnected');
    const [icloudForm, setIcloudForm] = useState({ apple_id: '', password: '' });
    const [tfaCode, setTfaCode] = useState('');
    const [showIcloudModal, setShowIcloudModal] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type }); setTimeout(() => setToast(null), 3000);
    };

    const handleIcloudLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await integrationsAPI.icloudLogin(icloudForm);
            if (res.data.status === '2fa_required') {
                setShowIcloudModal(false); setShow2FAModal(true);
                showToast('2FA code sent to your devices', 'info');
            } else {
                setIcloudStatus('connected'); setShowIcloudModal(false);
                showToast('iCloud connected');
            }
        } catch (err) { showToast(err.response?.data?.error || 'Login failed', 'error'); }
        finally { setLoading(false); }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await integrationsAPI.icloudVerify2FA({ code: tfaCode });
            setIcloudStatus('connected'); setShow2FAModal(false);
            showToast('iCloud connected');
        } catch (err) { showToast(err.response?.data?.error || '2FA verification failed', 'error'); }
        finally { setLoading(false); }
    };

    const handleGoogleConnect = async () => {
        setLoading(true);
        try {
            const res = await integrationsAPI.googleAuthURL();
            window.open(res.data.url, '_blank');
            setGoogleStatus('pending');
            showToast('Complete the authorization in the popup', 'info');
        } catch { showToast('Failed to start Google auth', 'error'); }
        finally { setLoading(false); }
    };

    return (
        <AppLayout>
            <div className="page-header animate-in">
                <h1>Integrations</h1>
                <p>Connect external services to sync your data</p>
            </div>

            <div className="content-grid animate-in" style={{ maxWidth: 800 }}>
                {/* iCloud */}
                <div className="integration-card">
                    <div className="integration-icon"><Cloud size={32} strokeWidth={1.5} /></div>
                    <h3>Apple iCloud</h3>
                    <p>Import photos and files from your iCloud account</p>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                        {icloudStatus === 'connected' ? (
                            <span className="badge badge-green"><CheckCircle2 size={12} /> Connected</span>
                        ) : (
                            <span className="badge badge-orange"><Circle size={12} /> Not Connected</span>
                        )}
                    </div>
                    {icloudStatus === 'connected' ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Sync started', 'info')}>
                                <RefreshCw size={13} /> Sync Photos
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setIcloudStatus('disconnected')}>
                                <Unplug size={13} /> Disconnect
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setShowIcloudModal(true)}>
                            Connect iCloud
                        </button>
                    )}
                </div>

                {/* Google Photos */}
                <div className="integration-card">
                    <div className="integration-icon"><Camera size={32} strokeWidth={1.5} /></div>
                    <h3>Google Photos</h3>
                    <p>Import photos from your Google Photos library</p>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                        {googleStatus === 'connected' ? (
                            <span className="badge badge-green"><CheckCircle2 size={12} /> Connected</span>
                        ) : googleStatus === 'pending' ? (
                            <span className="badge badge-orange"><Loader2 size={12} className="spin-icon" /> Pending Auth</span>
                        ) : (
                            <span className="badge badge-orange"><Circle size={12} /> Not Connected</span>
                        )}
                    </div>
                    {googleStatus === 'connected' ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Sync started', 'info')}>
                                <RefreshCw size={13} /> Sync Photos
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setGoogleStatus('disconnected')}>
                                <Unplug size={13} /> Disconnect
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={handleGoogleConnect} disabled={loading}>
                            Connect Google Photos
                        </button>
                    )}
                </div>
            </div>

            {/* iCloud Login Modal */}
            {showIcloudModal && (
                <div className="modal-overlay" onClick={() => setShowIcloudModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Cloud size={18} style={{ marginRight: 8, verticalAlign: -3 }} />Connect iCloud</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowIcloudModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleIcloudLogin}>
                            <div className="modal-body">
                                <div className="form-group"><label>Apple ID</label><input type="email" className="form-input" placeholder="your@icloud.com" value={icloudForm.apple_id} onChange={(e) => setIcloudForm({ ...icloudForm, apple_id: e.target.value })} /></div>
                                <div className="form-group"><label>Password</label><input type="password" className="form-input" placeholder="Your iCloud password" value={icloudForm.password} onChange={(e) => setIcloudForm({ ...icloudForm, password: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowIcloudModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <><Loader2 size={15} className="spin-icon" /> Connecting...</> : 'Connect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2FA Modal */}
            {show2FAModal && (
                <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Lock size={18} style={{ marginRight: 8, verticalAlign: -3 }} />Verification Code</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShow2FAModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleVerify2FA}>
                            <div className="modal-body">
                                <p style={{ color: 'var(--text-400)', fontSize: '0.88rem', marginBottom: 16 }}>
                                    A verification code has been sent to your Apple devices. Enter it below.
                                </p>
                                <div className="form-group">
                                    <label>6-Digit Code</label>
                                    <input type="text" className="form-input" placeholder="000000" maxLength={6} value={tfaCode} onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, ''))} style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShow2FAModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading || tfaCode.length !== 6}>
                                    {loading ? <><Loader2 size={15} className="spin-icon" /> Verifying...</> : 'Verify'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={14} /> : toast.type === 'error' ? <AlertCircle size={14} /> : <AlertCircle size={14} />} {toast.message}
                </div>
            )}
        </AppLayout>
    );
}
