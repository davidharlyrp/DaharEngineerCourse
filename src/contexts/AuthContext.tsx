import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePocketBase } from './PocketBaseContext';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { pb } = usePocketBase();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const authData = pb.authStore.model;
    if (authData) {
      setUser({
        id: authData.id,
        email: authData.email,
        name: authData.name || authData.email,
        avatar: authData.avatar,
        created: authData.created,
        updated: authData.updated,
        collectionId: authData.collectionId,
        collectionName: authData.collectionName,
      });
    }
    setIsLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      if (model) {
        setUser({
          id: model.id,
          email: model.email,
          name: model.name || model.email,
          avatar: model.avatar,
          created: model.created,
          updated: model.updated,
          collectionId: model.collectionId,
          collectionName: model.collectionName,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [pb]);

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setUser({
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name || authData.record.email,
        avatar: authData.record.avatar,
        created: authData.record.created,
        updated: authData.record.updated,
        collectionId: authData.record.collectionId,
        collectionName: authData.record.collectionName,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      await pb.collection('users').create(data);

      // Auto login after registration
      await login(email, password);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (!pb.authStore.isValid) return;

      const authData = await pb.collection('users').authRefresh();
      setUser({
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name || authData.record.email,
        avatar: authData.record.avatar,
        created: authData.record.created,
        updated: authData.record.updated,
        collectionId: authData.record.collectionId,
        collectionName: authData.record.collectionName,
      });
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails (e.g. token expired), we might want to logout
      if (pb.authStore.isValid === false) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
