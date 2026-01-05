import { createContext, useContext, useCallback } from 'react';

interface ProgressContextType {
  done: () => void;
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export const useProgress = () => {
  // Return no-op functions - loading is now handled locally by each page
  return { done: () => {}, isLoading: false };
};

export const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
  // No global spinner - each page manages its own loading state with skeletons
  const done = useCallback(() => {}, []);

  return (
    <ProgressContext.Provider value={{ done, isLoading: false }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgressQuery = () => {
  return { 
    withProgress: async <T,>(promise: Promise<T>): Promise<T> => {
      return promise;
    },
    done: () => {},
    isLoading: false 
  };
};
