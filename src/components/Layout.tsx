import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const Layout = ({ children, showHeader = true }: LayoutProps) => {
  const location = useLocation();
  // Hide header on admin pages (they have their own AdminLayout)
  const isAdminPage = location.pathname.startsWith('/admin');
  const shouldShowHeader = showHeader && !isAdminPage;

  return (
    <div className="min-h-screen">
      {shouldShowHeader && <Header />}
      <main className={shouldShowHeader ? "pt-24" : ""}>
        {children}
      </main>
    </div>
  );
};

