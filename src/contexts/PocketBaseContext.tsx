import React, { createContext, useContext, useEffect, useState } from 'react';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

interface PocketBaseContextType {
  pb: PocketBase;
  isConnected: boolean;
}

const PocketBaseContext = createContext<PocketBaseContextType | null>(null);

export function PocketBaseProvider({ children }: { children: React.ReactNode }) {
  const [pb] = useState(() => new PocketBase(POCKETBASE_URL));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check connection
    const checkConnection = async () => {
      try {
        await pb.health.check();
        setIsConnected(true);
      } catch (error) {
        console.warn('PocketBase connection failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, [pb]);

  return (
    <PocketBaseContext.Provider value={{ pb, isConnected }}>
      {children}
    </PocketBaseContext.Provider>
  );
}

export function usePocketBase() {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }
  return context;
}
