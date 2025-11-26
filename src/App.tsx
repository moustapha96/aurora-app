import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { MaintenanceMode } from "@/components/MaintenanceMode";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberCard from "./pages/MemberCard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Business from "./pages/Business";
import Members from "./pages/Members";
import Personal from "./pages/Personal";
import Family from "./pages/Family";
import Network from "./pages/Network";
import Messages from "./pages/Messages";

import Concierge from "./pages/Concierge";
import Metaverse from "./pages/Metaverse";
import Marketplace from "./pages/Marketplace";
import Payment from "./pages/Payment";
import CreateTestMembers from "./pages/CreateTestMembers";
import Terms from "./pages/Terms";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateAdmin from "./pages/CreateAdmin";
import VerifyEmail from "./pages/VerifyEmail";
import ActivityHistory from "./pages/ActivityHistory";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMembers from "./pages/admin/Members";
import AdminRoles from "./pages/admin/Roles";
import AdminModeration from "./pages/admin/Moderation";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminConnections from "./pages/admin/Connections";
import AdminContent from "./pages/admin/Content";
import AdminLogs from "./pages/admin/Logs";
import AdminReports from "./pages/admin/Reports";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SettingsProvider>
        <RegistrationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MaintenanceMode>
                <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/member-card" element={<MemberCard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/business" element={<Business />} />
              <Route path="/business/:id" element={<Business />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<Members />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/personal/:id" element={<Personal />} />
              <Route path="/family" element={<Family />} />
              <Route path="/family/:id" element={<Family />} />
              <Route path="/network" element={<Network />} />
              <Route path="/concierge" element={<Concierge />} />
              <Route path="/metaverse" element={<Metaverse />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/create-test-members" element={<CreateTestMembers />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/new-password" element={<ResetPassword />} />
              <Route path="/create-admin" element={<CreateAdmin />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/activity-history" element={<ActivityHistory />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/connections" element={<AdminConnections />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/contact" element={<Contact />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
              </MaintenanceMode>
            </BrowserRouter>
          </TooltipProvider>
        </RegistrationProvider>
      </SettingsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
