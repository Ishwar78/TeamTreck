import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { SuperAdminAuthGuard, CompanyAdminAuthGuard } from "@/components/AuthGuards";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import CompanyAdminLogin from "./pages/CompanyAdminLogin";
import Download from "./pages/Download";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Screenshots from "./pages/Screenshots";
import TimeLogs from "./pages/TimeLogs";
import AppUsage from "./pages/AppUsage";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import InviteMembers from "./pages/InviteMembers";
import TeamManagement from "./pages/TeamManagement";
import SettingsPage from "./pages/SettingsPage";
import SuperAdmin from "./pages/SuperAdmin";
import ActivityDashboard from "./pages/ActivityDashboard";
import ApiSpecification from "./pages/ApiSpecification";
import NotificationsPage from "./pages/NotificationsPage";
import Onboarding from "./pages/Onboarding";
import AppRestrictions from "./pages/AppRestrictions";
import IdleJustification from "./pages/IdleJustification";
import Attendance from "./pages/Attendance";
import AcceptInvite from "./pages/AcceptInvite";
import SignUp from "./pages/SignUp";
import TimeClaim from "./pages/TimeClaim";
import NotFound from "./pages/NotFound";
import TimeTracker from "./pages/features/TimeTracker";
import TeamManagementFeature from "./pages/features/TeamManagementFeature";
import ScreenshotMonitoring from "./pages/features/ScreenshotMonitoring";
import SupportTickets from "./pages/SupportTickets";
import UrlTracking from "./pages/features/UrlTracking";
import WorkforceAnalytics from "./pages/solutions/WorkforceAnalytics";
import ProductivityAnalytics from "./pages/solutions/ProductivityAnalytics";
import EmployeeMonitoring from "./pages/solutions/EmployeeMonitoring";
import TimeReporting from "./pages/solutions/TimeReporting";
import AgentPanel from "./pages/AgentPanel";
import SessionTimeline from "./pages/SessionTimeline";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import UserDetails from "./pages/UserDetails";
import Client from "./pages/client";
// import FAQ from "./pages/faq";
import StartTracking from "./pages/StartTracking";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HelpCenter from "./pages/HelpCenter";
import ScrollToTop from "./components/ScrollToTop";
import About from "./pages/About";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PlatformProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<CompanyAdminLogin />} />
              <Route path="/super/admin/login" element={<SuperAdminLogin />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/download" element={<Download />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/features/time-tracker" element={<TimeTracker />} />
              <Route path="/features/team-management" element={<TeamManagementFeature />} />
              <Route path="/features/screenshot-monitoring" element={<ScreenshotMonitoring />} />
              <Route path="/features/url-tracking" element={<UrlTracking />} />
              <Route path="/solutions/workforce-analytics" element={<WorkforceAnalytics />} />
              <Route path="/solutions/productivity-analytics" element={<ProductivityAnalytics />} />
              <Route path="/solutions/employee-monitoring" element={<EmployeeMonitoring />} />
              <Route path="/solutions/time-reporting" element={<TimeReporting />} />
              <Route path="/agent" element={<AgentPanel />} />
              <Route path="/client" element={<Client />} />
              {/* <Route path="/faq" element={<FAQ/>} /> */}
              <Route path="/team/:id" element={<UserDetails />} />
              <Route path="/StartTracking" element={<StartTracking />} />
              <Route path="/privacypolicy" element={<PrivacyPolicy />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/support" element={<ScrollToTop />} />
              <Route path="/about" element={<About />} />



              {/* Company Dashboard */}
              <Route path="/dashboard" element={<CompanyAdminAuthGuard><Dashboard /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/team" element={<CompanyAdminAuthGuard><TeamManagement /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/attendance" element={<CompanyAdminAuthGuard><Attendance /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/screenshots" element={<CompanyAdminAuthGuard><Screenshots /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/time" element={<CompanyAdminAuthGuard><TimeLogs /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/usage" element={<CompanyAdminAuthGuard><AppUsage /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/billing" element={<CompanyAdminAuthGuard><Billing /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/reports" element={<CompanyAdminAuthGuard><Reports /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/invite" element={<CompanyAdminAuthGuard><InviteMembers /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/settings" element={<CompanyAdminAuthGuard><SettingsPage /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/activity" element={<CompanyAdminAuthGuard><ActivityDashboard /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/api-spec" element={<CompanyAdminAuthGuard><ApiSpecification /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/notifications" element={<CompanyAdminAuthGuard><NotificationsPage /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/restrictions" element={<CompanyAdminAuthGuard><AppRestrictions /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/justifications" element={<CompanyAdminAuthGuard><IdleJustification /></CompanyAdminAuthGuard>} />

              <Route path="/dashboard/justifications" element={<CompanyAdminAuthGuard><IdleJustification /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/time-claim" element={<CompanyAdminAuthGuard><TimeClaim /></CompanyAdminAuthGuard>} />
              <Route path="/dashboard/support" element={<CompanyAdminAuthGuard><SupportTickets /></CompanyAdminAuthGuard>} />

              {/* Super Admin */}
              <Route path="/super-admin" element={<SuperAdminAuthGuard><SuperAdmin /></SuperAdminAuthGuard>} />
              <Route path="/super-admin/*" element={<SuperAdminAuthGuard><SuperAdmin /></SuperAdminAuthGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PlatformProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
