import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedShop = localStorage.getItem('ks_shop_info');
        if (storedShop) {
            setShop(JSON.parse(storedShop));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('ks_shop_token', data.token);
            localStorage.setItem('ks_shop_info', JSON.stringify(data.shop));
            setShop(data.shop);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('ks_shop_token');
        localStorage.removeItem('ks_shop_info');
        setShop(null);
    };

    const updateShop = (updatedData) => {
        const newShop = { ...shop, ...updatedData };
        setShop(newShop);
        localStorage.setItem('ks_shop_info', JSON.stringify(newShop));
    };

    return (
        <AuthContext.Provider value={{ shop, login, logout, loading, updateShop }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
