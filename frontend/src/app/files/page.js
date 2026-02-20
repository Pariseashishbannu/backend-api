'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { filesAPI } from '@/lib/api';
import {
    Search, Plus, FolderOpen, Image, Film, BookOpen,
    BarChart3, ShieldCheck, FileText, Star, StarOff,
    Download, Trash2, Upload,
} from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

const categoryColors = {
    DOCUMENT: 'blue', MEDICAL: 'red', FINANCE: 'green',
    PHOTO: 'purple', VIDEO: 'orange', OTHER: 'cyan',
};

const categoryIcons = {
    DOCUMENT: BookOpen, MEDICAL: ShieldCheck, FINANCE: BarChart3,
    PHOTO: Image, VIDEO: Film, OTHER: FileText, FOLDER: FolderOpen,
};

export default function FilesPage() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState('OTHER');
    const [toast, setToast] = useState(null);

    const loadFiles = useCallback(async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (categoryFilter) params.category = categoryFilter;
            const res = await filesAPI.list(params);
            const data = res.data.results || res.data;
            setFiles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load files:', err);
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('name', uploadFile.name);
            formData.append('category', uploadCategory);
            await filesAPI.create(formData);
            showToast('File uploaded successfully!');
            setShowUploadModal(false);
            setUploadFile(null);
            loadFiles();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Upload failed', 'error');
        } finally { setUploading(false); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try { await filesAPI.delete(id); showToast('File deleted'); loadFiles(); }
        catch { showToast('Delete failed', 'error'); }
    };

    const handleDownload = async (id, name) => {
        try {
            const res = await filesAPI.download(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = name; a.click();
            window.URL.revokeObjectURL(url);
            showToast('Download started');
        } catch { showToast('Download failed', 'error'); }
    };

    const handleFavorite = async (id, currentFav) => {
        try { await filesAPI.update(id, { is_favorite: !currentFav }); loadFiles(); }
        catch { showToast('Failed to update', 'error'); }
    };

    return (
        <AppLayout>
            <div className="page-header animate-in">
                <h1>File Manager</h1>
                <p>Upload, organize, and manage your files</p>
            </div>

            <div className="toolbar animate-in">
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
                        <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
                        <input type="text" className="form-input" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
                    </div>
                    <select className="form-input" style={{ width: 160 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="MEDICAL">Medical</option>
                        <option value="FINANCE">Finance</option>
                        <option value="PHOTO">Photo</option>
                        <option value="VIDEO">Video</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                    <Plus size={16} strokeWidth={2} /> Upload File
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div className="loading-spinner" />
                </div>
            ) : files.length === 0 ? (
                <div className="empty-state animate-in">
                    <FolderOpen size={40} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <h3>No files found</h3>
                    <p>{search || categoryFilter ? 'Try changing your filters' : 'Upload your first file to get started'}</p>
                    <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                        <Plus size={15} /> Upload File
                    </button>
                </div>
            ) : (
                <div className="file-grid animate-in">
                    {files.map((file) => {
                        const Icon = file.is_folder ? categoryIcons.FOLDER : (categoryIcons[file.category] || categoryIcons.OTHER);
                        return (
                            <div className="file-card" key={file.id}>
                                <div className="file-icon"><Icon size={20} strokeWidth={1.6} /></div>
                                <div className="file-name" title={file.name}>{file.name}</div>
                                <div className="file-meta">
                                    <span className={`badge badge-${categoryColors[file.category] || 'purple'}`}>{file.category}</span>
                                    <span>{formatBytes(file.size)}</span>
                                    <span>{timeAgo(file.updated_at)}</span>
                                </div>
                                {file.tags && file.tags.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {file.tags.map((tag) => (
                                            <span key={tag.id || tag.name} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{tag.name}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="file-actions">
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleFavorite(file.id, file.is_favorite)} title={file.is_favorite ? 'Unfavorite' : 'Favorite'}>
                                        {file.is_favorite ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                                    </button>
                                    {!file.is_folder && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(file.id, file.name)}>
                                            <Download size={14} />
                                        </button>
                                    )}
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(file.id, file.name)} style={{ marginLeft: 'auto' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Upload size={18} style={{ marginRight: 8, verticalAlign: -3 }} />Upload File</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowUploadModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Select File</label>
                                    <input type="file" className="form-input" onChange={(e) => setUploadFile(e.target.files[0])} style={{ padding: 10 }} />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                                        <option value="DOCUMENT">Document</option>
                                        <option value="MEDICAL">Medical</option>
                                        <option value="FINANCE">Finance</option>
                                        <option value="PHOTO">Photo</option>
                                        <option value="VIDEO">Video</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!uploadFile || uploading}>
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
        </AppLayout>
    );
}
