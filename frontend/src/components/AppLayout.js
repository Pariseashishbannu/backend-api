'use client';

import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
}
