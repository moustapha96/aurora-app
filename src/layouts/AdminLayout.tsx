import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminRoute } from '@/components/AdminRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </AdminRoute>
  );
};
