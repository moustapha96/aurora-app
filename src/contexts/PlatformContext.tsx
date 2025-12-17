import React, { createContext, useContext, ReactNode } from 'react';
import { usePlatform, PlatformInfo } from '@/hooks/usePlatform';

const PlatformContext = createContext<PlatformInfo | undefined>(undefined);

interface PlatformProviderProps {
  children: ReactNode;
}

export function PlatformProvider({ children }: PlatformProviderProps) {
  const platformInfo = usePlatform();

  return (
    <PlatformContext.Provider value={platformInfo}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatformContext(): PlatformInfo {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatformContext must be used within a PlatformProvider');
  }
  return context;
}
