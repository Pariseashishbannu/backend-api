'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const { register, error, setError } = useAuth();
    const router = useRouter();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.email || !form.password) {
            setError('Please fill in required fields');
            return;
        }
        if (form.password !== form.password2) {
            setError('Passwords do not match');
            return;
        }
        setSubmitting(true);
        const success = await register(form);
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
                <h1>Create Account</h1>
                <p className="auth-subtitle">Join the control center</p>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" name="first_name" className="form-input" placeholder="John" value={form.first_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" name="last_name" className="form-input" placeholder="Doe" value={form.last_name} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username *</label>
                        <input type="text" name="username" className="form-input" placeholder="johndoe" value={form.username} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Password *</label>
                        <input type="password" name="password" className="form-input" placeholder="Create a password" value={form.password} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <input type="password" name="password2" className="form-input" placeholder="Repeat your password" value={form.password2} onChange={handleChange} required />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: 4 }}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={17} className="spin-icon" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
