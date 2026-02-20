'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { filesAPI, auditAPI } from '@/lib/api';
import {
  Files, FolderOpen, HardDrive, Star,
  Clock, ArrowRight, Image, Film,
  BookOpen, BarChart3, FileText, Pencil,
  LogIn, Upload, Trash2, ShieldCheck,
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

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, storageRes, filesRes, auditRes] = await Promise.allSettled([
        filesAPI.stats(),
        filesAPI.storageStats(),
        filesAPI.list({ ordering: '-created_at', limit: 5 }),
        auditAPI.list(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (storageRes.status === 'fulfilled') setStorageStats(storageRes.value.data);
      if (filesRes.status === 'fulfilled') {
        const files = filesRes.value.data.results || filesRes.value.data;
        setRecentFiles(Array.isArray(files) ? files.slice(0, 5) : []);
      }
      if (auditRes.status === 'fulfilled') {
        const logs = auditRes.value.data.results || auditRes.value.data;
        setAuditLogs(Array.isArray(logs) ? logs.slice(0, 8) : []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const storagePercent = storageStats
    ? Math.min(100, ((storageStats.used_bytes || 0) / ((storageStats.quota_gb || 10) * 1024 * 1024 * 1024)) * 100)
    : 0;

  const getFileIcon = (category) => {
    const map = {
      PHOTO: Image,
      VIDEO: Film,
      DOCUMENT: BookOpen,
      FINANCE: BarChart3,
      MEDICAL: ShieldCheck,
    };
    const Icon = map[category] || FileText;
    return <Icon size={16} strokeWidth={1.8} />;
  };

  const getActivityIcon = (action) => {
    if (!action) return <Pencil size={15} strokeWidth={1.8} />;
    const lower = action.toLowerCase();
    if (lower.includes('login')) return <LogIn size={15} strokeWidth={1.8} />;
    if (lower.includes('upload')) return <Upload size={15} strokeWidth={1.8} />;
    if (lower.includes('delete')) return <Trash2 size={15} strokeWidth={1.8} />;
    return <Pencil size={15} strokeWidth={1.8} />;
  };

  return (
    <AppLayout>
      <div className="page-header animate-in">
        <h1>Dashboard</h1>
        <p>Welcome back — here&apos;s your overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card animate-in">
          <div className="stat-icon purple"><Files size={18} strokeWidth={1.8} /></div>
          <div className="stat-value">{loading ? '—' : (stats?.total_files ?? 0)}</div>
          <div className="stat-label">Total Files</div>
        </div>

        <div className="stat-card animate-in" style={{ animationDelay: '50ms' }}>
          <div className="stat-icon blue"><FolderOpen size={18} strokeWidth={1.8} /></div>
          <div className="stat-value">{loading ? '—' : (stats?.total_folders ?? 0)}</div>
          <div className="stat-label">Folders</div>
        </div>

        <div className="stat-card animate-in" style={{ animationDelay: '100ms' }}>
          <div className="stat-icon green"><HardDrive size={18} strokeWidth={1.8} /></div>
          <div className="stat-value">{loading ? '—' : formatBytes(storageStats?.used_bytes || stats?.total_size || 0)}</div>
          <div className="stat-label">Storage Used</div>
        </div>

        <div className="stat-card animate-in" style={{ animationDelay: '150ms' }}>
          <div className="stat-icon orange"><Star size={18} strokeWidth={1.8} /></div>
          <div className="stat-value">{loading ? '—' : (stats?.favorites ?? 0)}</div>
          <div className="stat-label">Favorites</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Storage Usage */}
        <div className="card animate-in" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h3><HardDrive size={15} strokeWidth={1.8} style={{ marginRight: 8, verticalAlign: -2 }} />Storage Usage</h3>
            <span className="badge badge-purple">{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(var(--accent) ${storagePercent * 3.6}deg, var(--surface-4) ${storagePercent * 3.6}deg)`,
                }}
              >
                <div
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-100)' }}>
                    {formatBytes(storageStats?.used_bytes || 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-500)' }}>
                    of {storageStats?.quota_gb || 10} GB
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {stats?.by_category &&
                  Object.entries(stats.by_category).map(([cat, count]) => (
                    <div
                      key={cat}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ color: 'var(--text-400)' }}>{cat}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-200)' }}>{count}</span>
                    </div>
                  ))}
                {!stats?.by_category && (
                  <p style={{ color: 'var(--text-500)', fontSize: '0.85rem' }}>
                    Upload files to see category breakdown
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card animate-in" style={{ animationDelay: '250ms' }}>
          <div className="card-header">
            <h3><Clock size={15} strokeWidth={1.8} style={{ marginRight: 8, verticalAlign: -2 }} />Recent Activity</h3>
            <a href="/audit" className="btn btn-ghost btn-sm">View all <ArrowRight size={13} /></a>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {auditLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <Clock size={28} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No activity yet</p>
              </div>
            ) : (
              <div>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 22px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ opacity: 0.5, display: 'flex' }}>
                      {getActivityIcon(log.action)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.action}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-500)' }}>
                        {log.ip_address && `${log.ip_address} · `}
                        {timeAgo(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="card animate-in" style={{ marginTop: 20, animationDelay: '300ms' }}>
        <div className="card-header">
          <h3><Files size={15} strokeWidth={1.8} style={{ marginRight: 8, verticalAlign: -2 }} />Recent Files</h3>
          <a href="/files" className="btn btn-ghost btn-sm">View all <ArrowRight size={13} /></a>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {recentFiles.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <Files size={32} strokeWidth={1.3} style={{ opacity: 0.3, marginBottom: 8 }} />
              <h3>No files yet</h3>
              <p>Upload your first file to get started</p>
              <a href="/files" className="btn btn-primary">Upload Files</a>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Modified</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((file) => (
                  <tr key={file.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', opacity: 0.6 }}>{getFileIcon(file.category)}</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-100)' }}>{file.name}</span>
                    </td>
                    <td><span className="badge badge-purple">{file.category}</span></td>
                    <td>{formatBytes(file.size)}</td>
                    <td>{timeAgo(file.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
