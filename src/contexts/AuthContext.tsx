import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi } from '@/lib/mockApi';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Omit<User, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi.getCurrentUser(token)
        .then(setUser)
        .catch(() => localStorage.removeItem('auth_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user, token } = await authApi.login(email, password);
      localStorage.setItem('auth_token', token);
      setUser(user);
      toast.success(`¡Bienvenido, ${user.name}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Omit<User, 'id' | 'createdAt' | 'isActive'>) => {
    setIsLoading(true);
    try {
      const { user, token } = await authApi.register(data);
      localStorage.setItem('auth_token', token);
      setUser(user);
      toast.success('¡Cuenta creada exitosamente!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrarse');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    toast.success('Sesión cerrada');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
