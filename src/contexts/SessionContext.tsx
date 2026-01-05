import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const DEFAULT_INACTIVITY_TIMEOUT = 10; // 10 minutes default
const WARNING_BEFORE_LOGOUT = 60 * 1000; // 1 minute warning
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // Refresh token every 4 minutes

interface SessionContextType {
  isAuthenticated: boolean;
  resetInactivityTimer: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Public routes that don't require session management
const PUBLIC_ROUTES = ['/login', '/register', '/terms', '/landing'];

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inactivityTimeout, setInactivityTimeout] = useState(DEFAULT_INACTIVITY_TIMEOUT * 60 * 1000);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);

  const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));

  // Fetch inactivity timeout from admin settings
  useEffect(() => {
    const fetchInactivityTimeout = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'inactivity_timeout_minutes')
          .maybeSingle();

        if (!error && data?.setting_value) {
          const minutes = parseInt(data.setting_value, 10);
          if (!isNaN(minutes) && minutes > 0) {
            setInactivityTimeout(minutes * 60 * 1000);
          }
        }
      } catch (err) {
        console.error('Error fetching inactivity timeout:', err);
      }
    };

    fetchInactivityTimeout();
  }, []);

  // Logout user due to inactivity
  const logoutUser = useCallback(async () => {
    console.log('Session expired due to inactivity');
    const timeoutMinutes = Math.round(inactivityTimeout / 60000);
    toast.error('Session expirée', {
      description: `Vous avez été déconnecté après ${timeoutMinutes} minutes d'inactivité.`,
      duration: 5000,
    });
    
    // Clear all timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
    
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  // Show warning before logout
  const showWarning = useCallback(() => {
    if (!isWarningShownRef.current) {
      isWarningShownRef.current = true;
      toast.warning('Session bientôt expirée', {
        description: 'Votre session expirera dans 1 minute. Interagissez avec l\'application pour rester connecté.',
        duration: 10000,
      });
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated || isPublicRoute) return;
    
    lastActivityRef.current = Date.now();
    isWarningShownRef.current = false;

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Set warning timer (1 minute before logout)
    warningTimerRef.current = setTimeout(() => {
      showWarning();
    }, inactivityTimeout - WARNING_BEFORE_LOGOUT);

    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      logoutUser();
    }, inactivityTimeout);
  }, [isAuthenticated, isPublicRoute, logoutUser, showWarning, inactivityTimeout]);

  // Refresh token automatically
  const refreshToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return;
      }

      // Check if user is active
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity < inactivityTimeout) {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          if (refreshError.message.includes('expired') || refreshError.message.includes('invalid')) {
            toast.info('Reconnexion en cours...', {
              description: 'Mise à jour de votre session.',
              duration: 2000,
            });
          }
        } else if (data.session) {
          console.log('Token refreshed successfully');
        }
      }
    } catch (err) {
      console.error('Error during token refresh:', err);
    }
  }, []);

  // Activity event handler
  const handleActivity = useCallback(() => {
    if (isAuthenticated && !isPublicRoute) {
      resetInactivityTimer();
    }
  }, [isAuthenticated, isPublicRoute, resetInactivityTimer]);

  // Initialize session management
  useEffect(() => {
    let mounted = true;
    
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setIsAuthenticated(!!session);
        
        if (session && !isPublicRoute) {
          resetInactivityTimer();
          
          // Clear any existing interval before setting new one
          if (tokenRefreshTimerRef.current) {
            clearInterval(tokenRefreshTimerRef.current);
          }
          
          // Setup token refresh
          tokenRefreshTimerRef.current = setInterval(() => {
            refreshToken();
          }, TOKEN_REFRESH_INTERVAL);
        }
      } catch (error) {
        console.error('Session init error:', error);
      }
    };

    initSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_OUT') {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
      } else if (event === 'SIGNED_IN' && session) {
        if (!isPublicRoute) {
          resetInactivityTimer();
          
          // Clear existing interval before setting new one
          if (tokenRefreshTimerRef.current) {
            clearInterval(tokenRefreshTimerRef.current);
          }
          
          tokenRefreshTimerRef.current = setInterval(() => {
            refreshToken();
          }, TOKEN_REFRESH_INTERVAL);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed by Supabase');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
    };
  }, [isPublicRoute, refreshToken, resetInactivityTimer]);

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated || isPublicRoute) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, isPublicRoute, handleActivity]);

  return (
    <SessionContext.Provider value={{ isAuthenticated, resetInactivityTimer }}>
      {children}
    </SessionContext.Provider>
  );
};
