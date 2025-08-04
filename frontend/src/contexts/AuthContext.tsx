import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicId: string;
}

interface Clinic {
  id: string;
  name: string;
  subscriptionStatus: string;
}

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedClinic = localStorage.getItem('clinic');

    if (token && storedUser && storedClinic) {
      setUser(JSON.parse(storedUser));
      setClinic(JSON.parse(storedClinic));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, clinic, token, refreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('clinic', JSON.stringify(clinic));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setClinic(clinic);
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (data: any) => {
    try {
      const response = await api.post('/auth/register', data);
      const { user, clinic, token, refreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('clinic', JSON.stringify(clinic));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setClinic(clinic);
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('clinic');
    
    delete api.defaults.headers.common['Authorization'];
    
    setUser(null);
    setClinic(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, clinic, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};