import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/user/');
      setUser(response.data);
      const role = response.data.roles?.[0] || 'Проектант';
      setUserRole(role);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Ошибка авторизации:', err);
      localStorage.clear();
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      await checkAuth();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const isOrganizer = () => userRole === 'Организатор';
  const isTutor = () => userRole === 'Куратор';
  const isProjectant = () => userRole === 'Проектант';

  const hasRole = (allowedRoles) => {
    return allowedRoles.includes(userRole);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      loading,
      isAuthenticated,
      isOrganizer,
      isTutor,
      isProjectant,
      hasRole,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};