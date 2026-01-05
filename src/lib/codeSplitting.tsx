import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component
 */
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export const SectionLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/**
 * Create a lazy-loaded component with loading fallback
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);
  
  // Store the import function for preloading
  (LazyComponent as any).preload = importFn;
  
  return LazyComponent;
}

/**
 * Wrap a lazy component with Suspense
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  Fallback: ComponentType = PageLoader
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<Fallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component (for navigation hints)
 */
export function preloadComponent(component: any) {
  if (component && typeof component.preload === 'function') {
    component.preload();
  }
}

// Lazy loaded pages for code splitting
export const LazyPages = {
  // Main pages
  Index: lazyWithPreload(() => import('@/pages/Index')),
  Login: lazyWithPreload(() => import('@/pages/Login')),
  Register: lazyWithPreload(() => import('@/pages/Register')),
  ResetPassword: lazyWithPreload(() => import('@/pages/ResetPassword')),
  
  // Member pages
  Profile: lazyWithPreload(() => import('@/pages/Profile')),
  EditProfile: lazyWithPreload(() => import('@/pages/EditProfile')),
  MemberCard: lazyWithPreload(() => import('@/pages/MemberCard')),
  Members: lazyWithPreload(() => import('@/pages/Members')),
  
  // Content modules
  Business: lazyWithPreload(() => import('@/pages/Business')),
  Family: lazyWithPreload(() => import('@/pages/Family')),
  Personal: lazyWithPreload(() => import('@/pages/Personal')),
  Network: lazyWithPreload(() => import('@/pages/Network')),
  
  // Social features
  Messages: lazyWithPreload(() => import('@/pages/Messages')),
  Connections: lazyWithPreload(() => import('@/pages/Connections')),
  Referrals: lazyWithPreload(() => import('@/pages/Referrals')),
  
  // Settings
  Settings: lazyWithPreload(() => import('@/pages/Settings')),
  SecuritySettings: lazyWithPreload(() => import('@/pages/SecuritySettings')),
  
  // Other pages
  Contact: lazyWithPreload(() => import('@/pages/Contact')),
  Concierge: lazyWithPreload(() => import('@/pages/Concierge')),
  Metaverse: lazyWithPreload(() => import('@/pages/Metaverse')),
  Marketplace: lazyWithPreload(() => import('@/pages/Marketplace')),
  Payment: lazyWithPreload(() => import('@/pages/Payment')),
  Terms: lazyWithPreload(() => import('@/pages/Terms')),
  MemberLanding: lazyWithPreload(() => import('@/pages/MemberLanding')),
  LandingPreview: lazyWithPreload(() => import('@/pages/LandingPreview')),
  LinkedAccount: lazyWithPreload(() => import('@/pages/LinkedAccount')),
  
  // Admin pages
  AdminDashboard: lazyWithPreload(() => import('@/pages/admin/AdminDashboard')),
  AdminMembers: lazyWithPreload(() => import('@/pages/admin/AdminMembers')),
  AdminUsersSecurity: lazyWithPreload(() => import('@/pages/admin/AdminUsersSecurity')),
  AdminRoles: lazyWithPreload(() => import('@/pages/admin/AdminRoles')),
  AdminAnalytics: lazyWithPreload(() => import('@/pages/admin/AdminAnalytics')),
  AdminSettings: lazyWithPreload(() => import('@/pages/admin/AdminSettings')),
  AdminModeration: lazyWithPreload(() => import('@/pages/admin/AdminModeration')),
  AdminReports: lazyWithPreload(() => import('@/pages/admin/AdminReports')),
  AdminLogs: lazyWithPreload(() => import('@/pages/admin/AdminLogs')),
  AdminContent: lazyWithPreload(() => import('@/pages/admin/AdminContent')),
  AdminConnections: lazyWithPreload(() => import('@/pages/admin/AdminConnections')),
  AdminDocumentVerification: lazyWithPreload(() => import('@/pages/admin/AdminDocumentVerification')),
  AdminApiConfig: lazyWithPreload(() => import('@/pages/admin/AdminApiConfig')),
  AdminCron: lazyWithPreload(() => import('@/pages/admin/AdminCron')),
};

/**
 * Preload common navigation targets
 */
export const preloadCommonPages = () => {
  // Preload pages likely to be visited after login
  preloadComponent(LazyPages.Profile);
  preloadComponent(LazyPages.Members);
  preloadComponent(LazyPages.Messages);
};

/**
 * Preload admin pages
 */
export const preloadAdminPages = () => {
  preloadComponent(LazyPages.AdminDashboard);
  preloadComponent(LazyPages.AdminMembers);
};
