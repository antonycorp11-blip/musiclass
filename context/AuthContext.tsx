
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Teacher } from '../types';

interface AuthContextType {
    currentUser: Teacher | null;
    loading: boolean;
    login: (user: Teacher) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('music_current_user');
        if (savedUser && savedUser !== 'undefined') {
            try {
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse saved user", e);
                localStorage.removeItem('music_current_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (user: Teacher) => {
        setCurrentUser(user);
        localStorage.setItem('music_current_user', JSON.stringify(user));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('music_current_user');
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
