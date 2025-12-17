import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { MaintenanceMode } from "@/components/MaintenanceMode";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Referrals from "./pages/Referrals";
import Connections from "./pages/Connections";
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
              <Route
                path="/member-card"
                element={(
                  <ProtectedRoute>
                    <MemberCard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/profile"
                element={(
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/profile/:id"
                element={(
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/edit-profile"
                element={(
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/business"
                element={(
                  <ProtectedRoute>
                    <Business />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/business/:id"
                element={(
                  <ProtectedRoute>
                    <Business />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/members"
                element={(
                  <ProtectedRoute>
                    <Members />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/members/:id"
                element={(
                  <ProtectedRoute>
                    <Members />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/personal"
                element={(
                  <ProtectedRoute>
                    <Personal />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/personal/:id"
                element={(
                  <ProtectedRoute>
                    <Personal />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/family"
                element={(
                  <ProtectedRoute>
                    <Family />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/family/:id"
                element={(
                  <ProtectedRoute>
                    <Family />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/network"
                element={(
                  <ProtectedRoute>
                    <Network />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/network/:id"
                element={(
                  <ProtectedRoute>
                    <Network />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/concierge"
                element={(
                  <ProtectedRoute>
                    <Concierge />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/metaverse"
                element={(
                  <ProtectedRoute>
                    <Metaverse />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/marketplace"
                element={(
                  <ProtectedRoute>
                    <Marketplace />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/payment"
                element={(
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/messages"
                element={(
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/referrals"
                element={(
                  <ProtectedRoute>
                    <Referrals />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/connections"
                element={(
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/create-test-members"
                element={(
                  <ProtectedRoute>
                    <CreateTestMembers />
                  </ProtectedRoute>
                )}
              />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/settings"
                element={(
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                )}
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/new-password" element={<ResetPassword />} />
              <Route path="/create-admin" element={<CreateAdmin />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
                path="/activity-history"
                element={(
                  <ProtectedRoute>
                    <ActivityHistory />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/dashboard"
                element={(
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/members"
                element={(
                  <ProtectedRoute>
                    <AdminMembers />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/roles"
                element={(
                  <ProtectedRoute>
                    <AdminRoles />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/moderation"
                element={(
                  <ProtectedRoute>
                    <AdminModeration />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/analytics"
                element={(
                  <ProtectedRoute>
                    <AdminAnalytics />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/connections"
                element={(
                  <ProtectedRoute>
                    <AdminConnections />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/content"
                element={(
                  <ProtectedRoute>
                    <AdminContent />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/logs"
                element={(
                  <ProtectedRoute>
                    <AdminLogs />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/reports"
                element={(
                  <ProtectedRoute>
                    <AdminReports />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/settings"
                element={(
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/contact"
                element={(
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                )}
              />
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
