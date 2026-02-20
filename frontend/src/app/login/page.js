'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login, error, setError } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }
        setSubmitting(true);
        const success = await login(username, password);
        if (success) {
            router.push('/');
        }
        setSubmitting(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-in">
                <div className="brand-logo">
                    <Zap size={32} strokeWidth={2} />
                </div>
                <h1>Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your control center</p>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: 8 }}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={17} className="spin-icon" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    Don&apos;t have an account?{' '}
                    <Link href="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}
