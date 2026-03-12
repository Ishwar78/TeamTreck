// ─── Role Types ───
export type AppRole = "super_admin" | "company_admin" | "sub_admin" | "user";

// ─── Permission Keys ───
export type Permission =
  | "view_dashboard"
  | "view_team"
  | "view_time_logs"
  | "view_screenshots"
  | "view_app_usage"
  | "view_activity"
  | "view_reports"
  | "view_notifications"
  | "view_api_spec"
  | "view_sessions"
  | "invite_members"
  | "manage_team"
  | "assign_roles"
  | "suspend_users"
  | "manage_billing"
  | "manage_settings"
  | "configure_monitoring"
  | "export_reports"
  | "view_attendance"
  | "platform_manage_companies"
  | "platform_manage_plans"
  | "platform_manage_subscriptions"
  | "platform_view_analytics";

// ─── Permission Matrix ───
const PERMISSION_MATRIX: Record<AppRole, Set<Permission>> = {
  super_admin: new Set([
    "platform_manage_companies",
    "platform_manage_plans",
    "platform_manage_subscriptions",
    "platform_view_analytics",
  ]),
  company_admin: new Set([
    "view_dashboard",
    "view_team",
    "view_time_logs",
    "view_screenshots",
    "view_app_usage",
    "view_activity",
    "view_reports",
    "view_notifications",
    "view_api_spec",
    "invite_members",
    "manage_team",
    "assign_roles",
    "suspend_users",
    "manage_billing",
    "manage_settings",
    "configure_monitoring",
    "export_reports",
    "view_attendance",
    "view_sessions",
  ]),
  sub_admin: new Set([
    "view_dashboard",
    "view_team",
    "view_time_logs",
    "view_screenshots",
    "view_app_usage",
    "view_activity",
    "view_reports",
    "view_notifications",
    "view_api_spec",
    "export_reports",
    "view_attendance",
    "view_sessions",
  ]),
  user: new Set([
    "view_dashboard",
    "view_time_logs",
    "view_notifications",
    "view_attendance",
  ]),
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.has(permission) ?? false;
}

export function getPermissions(role: AppRole): Permission[] {
  return Array.from(PERMISSION_MATRIX[role] ?? []);
}

// ─── Role Display Labels ───
export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  sub_admin: "Sub-Admin",
  user: "User",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: "Platform owner — manage all companies, plans, subscriptions & revenue",
  company_admin: "Full company control — invite users, manage billing, configure monitoring",
  sub_admin: "View users, reports & screenshots — no billing or settings access",
  user: "Monitored employee — view own dashboard and time logs",
};
 