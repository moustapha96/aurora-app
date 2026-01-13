import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminRoute } from '@/components/AdminRoute';
import { Header } from '@/components/Header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AdminRoute>
      <Header />
      <div className="flex min-h-screen bg-background pt-16">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AdminRoute>
  );
};
