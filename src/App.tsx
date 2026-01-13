import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { GlobalMessageNotifications } from "@/components/GlobalMessageNotifications";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ProgressProvider } from "@/components/ui/progress-bar";
import createOptimizedQueryClient from "@/lib/queryConfig";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import LinkedAccount from "./pages/LinkedAccount";
import Connections from "./pages/Connections";
import Referrals from "./pages/Referrals";
import Settings from "./pages/Settings";
import SecuritySettings from "./pages/SecuritySettings";
import Contact from "./pages/Contact";

import Concierge from "./pages/Concierge";
import Metaverse from "./pages/Metaverse";
import Marketplace from "./pages/Marketplace";
import Payment from "./pages/Payment";
import CreateTestMembers from "./pages/CreateTestMembers";
import Terms from "./pages/Terms";
import MemberLanding from "./pages/MemberLanding";
import LandingPreview from "./pages/LandingPreview";
import VerificationCallback from "./pages/VerificationCallback";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminUsersSecurity from "./pages/admin/AdminUsersSecurity";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminReports from "./pages/admin/AdminReports";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminContent from "./pages/admin/AdminContent";
import AdminConnections from "./pages/admin/AdminConnections";
import AdminDocumentVerification from "./pages/admin/AdminDocumentVerification";
import AdminApiConfig from "./pages/admin/AdminApiConfig";
import AdminCron from "./pages/admin/AdminCron";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminMarketplace from "./pages/admin/AdminMarketplace";

// Optimized QueryClient with caching
const queryClient = createOptimizedQueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PlatformProvider>
      <LanguageProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ProgressProvider>
        <SessionProvider>
        <GlobalMessageNotifications />
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verification" element={<VerificationCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/member-card" element={<MemberCard />} />
          {/* <Route path="/member-card" element={<Profile />} /> */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/business" element={<Business />} />
          <Route path="/business/:id" element={<Business />} />
          <Route path="/members" element={<Members />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/personal/:id" element={<Personal />} />
          <Route path="/family" element={<Family />} />
          <Route path="/family/:id" element={<Family />} />
          <Route path="/network" element={<Network />} />
          <Route path="/linked-account" element={<LinkedAccount />} />
          <Route path="/linked-account/:id" element={<LinkedAccount />} />
          <Route path="/concierge" element={<Concierge />} />
          <Route path="/metaverse" element={<Metaverse />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/security-settings" element={<SecuritySettings />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/create-test-members" element={<CreateTestMembers />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/landing/:memberId" element={<MemberLanding />} />
          <Route path="/landing-preview" element={<LandingPreview />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/users-security" element={<AdminUsersSecurity />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/connections" element={<AdminConnections />} />
          <Route path="/admin/document-verification" element={<AdminDocumentVerification />} />
          <Route path="/admin/api-config" element={<AdminApiConfig />} />
          <Route path="/admin/cron" element={<AdminCron />} />
          <Route path="/admin/referrals" element={<AdminReferrals />} />
          <Route path="/admin/marketplace" element={<AdminMarketplace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </SessionProvider>
        </ProgressProvider>
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </PlatformProvider>
  </QueryClientProvider>
);

export default App;
