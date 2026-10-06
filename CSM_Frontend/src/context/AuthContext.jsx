import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');
    const email = localStorage.getItem('email') || sessionStorage.getItem('email');
    const createdAt = localStorage.getItem('createdAt') || sessionStorage.getItem('createdAt');
    
    if (token && username) {
      setUser({ username, role, email, createdAt });
    }
  }, []);

  const login = (data, rememberMe = true) => {
    // Purge any stale tokens from both storages before storing the new token
    localStorage.clear();
    sessionStorage.clear();

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem('token', data.token);
    targetStorage.setItem('username', data.username);
    targetStorage.setItem('role', data.role);
    if (data.email) targetStorage.setItem('email', data.email);
    if (data.createdAt) targetStorage.setItem('createdAt', data.createdAt);

    setUser({ 
      username: data.username, 
      role: data.role, 
      email: data.email || 'N/A', 
      createdAt: data.createdAt // Uses exact DB timestamp from LoginResponse
    });
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getInitials }}>
      {children}
    </AuthContext.Provider>
  );
};