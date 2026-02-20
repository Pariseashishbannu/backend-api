'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    FolderOpen,
    KeyRound,
    ScrollText,
    Plug,
    User,
    Zap,
    LogOut,
} from 'lucide-react';

const navItems = [
    {
        section: 'Overview',
        items: [
            { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        ],
    },
    {
        section: 'Management',
        items: [
            { href: '/files', icon: FolderOpen, label: 'Files' },
            { href: '/secrets', icon: KeyRound, label: 'Secrets Vault' },
            { href: '/audit', icon: ScrollText, label: 'Audit Log' },
        ],
    },
    {
        section: 'Connect',
        items: [
            { href: '/integrations', icon: Plug, label: 'Integrations' },
        ],
    },
    {
        section: 'Account',
        items: [
            { href: '/profile', icon: User, label: 'Profile' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const getInitials = () => {
        if (!user?.username) return '?';
        return user.username.charAt(0).toUpperCase();
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon"><Zap size={16} /></div>
                <div>
                    <h2>Parise API</h2>
                    <span>Control Center</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div className="nav-section" key={section.section}>
                        <div className="nav-section-title">{section.section}</div>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                                >
                                    <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info" onClick={logout} title="Click to logout">
                    <div className="user-avatar">{getInitials()}</div>
                    <div className="user-details">
                        <div className="name">{user?.username || 'Guest'}</div>
                        <div className="email">Click to logout</div>
                    </div>
                    <LogOut size={16} style={{ opacity: 0.4 }} />
                </div>
            </div>
        </aside>
    );
}
