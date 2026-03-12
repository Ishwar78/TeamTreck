import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/** Requires authenticated super_admin */
export const SuperAdminAuthGuard = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // ⏳ Wait until auth restore completes
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🚫 Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/super/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // 🚫 Wrong role trying to access super admin
  if (user.role !== "super_admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

/** Requires authenticated company user */
export const CompanyAdminAuthGuard = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // ⏳ Wait for auth restore
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🚫 Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // 🚫 Block super admin from company dashboard
  if (user.role === "super_admin") {
    return <Navigate to="/super-admin" replace />;
  }

  // 🚫 Missing company binding
  if (!user.company_id) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};