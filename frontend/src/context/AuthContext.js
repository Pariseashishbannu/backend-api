'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Verify the token is valid
            await authAPI.verifyToken(token);

            // Decode basic user info from JWT
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
                id: payload.user_id,
                username: payload.username || 'User',
            });
        } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (username, password) => {
        try {
            setError(null);
            const res = await authAPI.login(username, password);
            const { access, refresh } = res.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            const payload = JSON.parse(atob(access.split('.')[1]));
            setUser({
                id: payload.user_id,
                username: username,
            });

            return true;
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
            return false;
        }
    };

    const register = async (data) => {
        try {
            setError(null);
            await authAPI.register(data);
            // After registration, auto-login
            return await login(data.username, data.password);
        } catch (err) {
            const errData = err.response?.data;
            if (typeof errData === 'object') {
                const messages = Object.values(errData).flat().join(', ');
                setError(messages);
            } else {
                setError('Registration failed');
            }
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
