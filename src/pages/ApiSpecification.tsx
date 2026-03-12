import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Copy, Check, ChevronDown, ChevronRight, Lock, Send, Globe, Users, Camera, Clock, Monitor, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

type Endpoint = {
  method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  path: string;
  desc: string;
  auth: boolean;
  request?: string;
  response?: string;
};

type Section = {
  title: string;
  icon: React.ElementType;
  description: string;
  endpoints: Endpoint[];
};

const methodColors: Record<string, string> = {
  GET: "bg-status-active/10 text-status-active",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-status-idle/10 text-status-idle",
  PATCH: "bg-status-idle/10 text-status-idle",
  DELETE: "bg-destructive/10 text-destructive",
};

const sections: Section[] = [
  {
    title: "Authentication",
    icon: Lock,
    description: "Agent login, token refresh, and invite acceptance",
    endpoints: [
      {
        method: "POST", path: "/api/auth/login", desc: "Desktop agent login. Returns JWT + company config + plan rules.", auth: false,
        request: `{
  "email": "user@company.com",
  "password": "********",
  "agent_version": "1.2.0",
  "os": "windows",
  "machine_id": "HWID-abc123"
}`,
        response: `{
  "token": "eyJhbGciOi...",
  "refresh_token": "rt_abc...",
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "user",
    "company_id": "uuid",
    "display_name": "Alice Johnson"
  },
  "plan_rules": {
    "screenshot_frequency": 12,
    "idle_timeout_minutes": 5,
    "track_urls": true,
    "track_apps": true,
    "blur_screenshots": false,
    "auto_start": true
  }
}`,
      },
      {
        method: "POST", path: "/api/auth/refresh", desc: "Refresh expired JWT.", auth: true,
        request: `{ "refresh_token": "rt_abc..." }`,
        response: `{ "token": "eyJhbGciOi...", "refresh_token": "rt_new..." }`,
      },
      {
        method: "POST", path: "/api/auth/invite/accept", desc: "Accept team invitation from email link.", auth: false,
        request: `{
  "invite_token": "inv_abc123",
  "password": "newpassword",
  "display_name": "New User"
}`,
        response: `{ "token": "eyJhbGciOi...", "user": { ... } }`,
      },
    ],
  },
  {
    title: "Time Tracking",
    icon: Clock,
    description: "Heartbeat pings, session start/stop, idle events",
    endpoints: [
      {
        method: "POST", path: "/api/tracking/heartbeat", desc: "Periodic heartbeat (every 60s). Keeps session alive.", auth: true,
        request: `{
  "timestamp": "2026-02-09T14:30:00Z",
  "status": "active",
  "active_window": {
    "app_name": "VS Code",
    "window_title": "main.tsx — WEBMOK",
    "url": null
  }
}`,
        response: `{ "ok": true, "server_time": "2026-02-09T14:30:01Z" }`,
      },
      {
        method: "POST", path: "/api/tracking/session/start", desc: "Start a tracking session when agent launches.", auth: true,
        request: `{ "timestamp": "2026-02-09T09:00:00Z", "machine_id": "HWID-abc123" }`,
        response: `{ "session_id": "uuid", "started_at": "2026-02-09T09:00:00Z" }`,
      },
      {
        method: "POST", path: "/api/tracking/session/end", desc: "End the current tracking session.", auth: true,
        request: `{ "session_id": "uuid", "timestamp": "2026-02-09T17:30:00Z" }`,
        response: `{ "ok": true, "total_seconds": 30600 }`,
      },
      {
        method: "POST", path: "/api/tracking/idle", desc: "Report idle period (keyboard/mouse inactivity).", auth: true,
        request: `{
  "started_at": "2026-02-09T11:15:00Z",
  "ended_at": "2026-02-09T11:22:00Z",
  "duration_seconds": 420
}`,
        response: `{ "ok": true, "idle_event_id": "uuid" }`,
      },
    ],
  },
  {
    title: "Screenshots",
    icon: Camera,
    description: "Upload randomized screenshots from the agent",
    endpoints: [
      {
        method: "POST", path: "/api/screenshots/upload", desc: "Upload a screenshot (multipart/form-data).", auth: true,
        request: `FormData:
  file: <binary PNG/JPEG, max 2MB>
  timestamp: "2026-02-09T14:35:12Z"
  app_name: "VS Code"
  window_title: "main.tsx — WEBMOK"
  url: null (optional, for browsers)
  blurred: false`,
        response: `{
  "screenshot_id": "uuid",
  "storage_url": "https://storage.../screenshots/uuid.png",
  "captured_at": "2026-02-09T14:35:12Z"
}`,
      },
      {
        method: "GET", path: "/api/screenshots?user_id=&date=&page=1", desc: "List screenshots (dashboard use). Paginated.", auth: true,
        response: `{
  "screenshots": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "Alice Johnson",
      "url": "https://storage.../screenshots/uuid.png",
      "app_name": "VS Code",
      "window_title": "main.tsx",
      "captured_at": "2026-02-09T14:35:12Z",
      "blurred": false
    }
  ],
  "total": 142,
  "page": 1,
  "per_page": 20
}`,
      },
    ],
  },
  {
    title: "App & URL Tracking",
    icon: Monitor,
    description: "Batch-upload active window and URL tracking data",
    endpoints: [
      {
        method: "POST", path: "/api/tracking/apps/batch", desc: "Batch upload app usage logs (every 5 min).", auth: true,
        request: `{
  "entries": [
    {
      "app_name": "VS Code",
      "window_title": "main.tsx — WEBMOK",
      "started_at": "2026-02-09T14:00:00Z",
      "ended_at": "2026-02-09T14:04:30Z",
      "duration_seconds": 270
    },
    {
      "app_name": "Chrome",
      "window_title": "Stack Overflow",
      "url": "https://stackoverflow.com/q/123",
      "started_at": "2026-02-09T14:04:30Z",
      "ended_at": "2026-02-09T14:05:00Z",
      "duration_seconds": 30
    }
  ]
}`,
        response: `{ "ok": true, "inserted": 2 }`,
      },
    ],
  },
  {
    title: "Companies & Plans",
    icon: Users,
    description: "Company management and subscription enforcement",
    endpoints: [
      {
        method: "POST", path: "/api/companies/signup", desc: "Register a new company + admin user + select plan.", auth: false,
        request: `{
  "company_name": "Acme Corp",
  "admin_email": "admin@acme.com",
  "admin_password": "********",
  "admin_name": "Jane Admin",
  "plan_id": "professional"
}`,
        response: `{
  "company": { "id": "uuid", "name": "Acme Corp", "plan": "professional" },
  "user": { "id": "uuid", "role": "company_admin" },
  "token": "eyJhbGciOi..."
}`,
      },
      {
        method: "GET", path: "/api/companies/me", desc: "Get current company details and plan limits.", auth: true,
        response: `{
  "id": "uuid",
  "name": "Acme Corp",
  "plan": {
    "id": "professional",
    "max_users": 25,
    "screenshot_frequency": 12,
    "data_retention_days": 90
  },
  "current_users": 6,
  "can_invite": true
}`,
      },
      {
        method: "POST", path: "/api/companies/invite", desc: "Send team invite. Blocked if plan user limit reached.", auth: true,
        request: `{
  "email": "newuser@acme.com",
  "role": "user"
}`,
        response: `{ "invite_id": "uuid", "status": "sent" }
// or
{ "error": "USER_LIMIT_REACHED", "message": "Plan allows max 25 users. Upgrade to add more." }`,
      },
    ],
  },
  {
    title: "Roles & Permissions",
    icon: Shield,
    description: "Role management and access control",
    endpoints: [
      {
        method: "PATCH", path: "/api/users/:id/role", desc: "Change a user's role (admin only).", auth: true,
        request: `{ "role": "sub_admin" }`,
        response: `{ "ok": true, "user_id": "uuid", "new_role": "sub_admin" }`,
      },
      {
        method: "GET", path: "/api/users", desc: "List all users in the company (scoped by company_id).", auth: true,
        response: `{
  "users": [
    {
      "id": "uuid",
      "email": "alice@acme.com",
      "display_name": "Alice Johnson",
      "role": "user",
      "status": "active",
      "last_seen": "2026-02-09T14:30:00Z"
    }
  ]
}`,
      },
      {
        method: "DELETE", path: "/api/users/:id", desc: "Remove a user from the company.", auth: true,
        response: `{ "ok": true, "removed_user_id": "uuid" }`,
      },
    ],
  },
];

const dataModels = `
┌─────────────────────────────────────────────────────────┐
│  companies                                              │
│  ─────────                                              │
│  id            UUID  PK                                 │
│  name          TEXT                                     │
│  plan_id       TEXT  FK → plans.id                      │
│  created_at    TIMESTAMPTZ                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  users                                                  │
│  ─────                                                  │
│  id            UUID  PK  (= auth.users.id)              │
│  company_id    UUID  FK → companies.id                  │
│  email         TEXT                                     │
│  display_name  TEXT                                     │
│  status        ENUM  (active, suspended, removed)       │
│  created_at    TIMESTAMPTZ                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  user_roles                                             │
│  ──────────                                             │
│  id            UUID  PK                                 │
│  user_id       UUID  FK → users.id  (unique w/ role)    │
│  role          ENUM  (super_admin, company_admin,       │
│                       sub_admin, user)                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  plans                                                  │
│  ─────                                                  │
│  id            TEXT  PK  (starter, professional, etc.)   │
│  name          TEXT                                     │
│  max_users     INT                                      │
│  screenshot_freq  INT  (per hour)                       │
│  data_retention_days  INT                               │
│  price_monthly DECIMAL                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  tracking_sessions                                      │
│  ─────────────────                                      │
│  id            UUID  PK                                 │
│  user_id       UUID  FK → users.id                      │
│  company_id    UUID  FK → companies.id                  │
│  started_at    TIMESTAMPTZ                              │
│  ended_at      TIMESTAMPTZ  NULL                        │
│  machine_id    TEXT                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  time_logs                                              │
│  ─────────                                              │
│  id            UUID  PK                                 │
│  session_id    UUID  FK → tracking_sessions.id          │
│  user_id       UUID  FK → users.id                      │
│  company_id    UUID  FK → companies.id                  │
│  timestamp     TIMESTAMPTZ                              │
│  status        ENUM  (active, idle)                     │
│  app_name      TEXT                                     │
│  window_title  TEXT                                     │
│  url           TEXT  NULL                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  idle_events                                            │
│  ───────────                                            │
│  id            UUID  PK                                 │
│  user_id       UUID  FK → users.id                      │
│  company_id    UUID  FK → companies.id                  │
│  started_at    TIMESTAMPTZ                              │
│  ended_at      TIMESTAMPTZ                              │
│  duration_sec  INT                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  screenshots                                            │
│  ───────────                                            │
│  id            UUID  PK                                 │
│  user_id       UUID  FK → users.id                      │
│  company_id    UUID  FK → companies.id                  │
│  storage_url   TEXT                                     │
│  app_name      TEXT                                     │
│  window_title  TEXT                                     │
│  url           TEXT  NULL                               │
│  blurred       BOOLEAN                                  │
│  captured_at   TIMESTAMPTZ                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  app_usage_logs                                         │
│  ──────────────                                         │
│  id            UUID  PK                                 │
│  user_id       UUID  FK → users.id                      │
│  company_id    UUID  FK → companies.id                  │
│  app_name      TEXT                                     │
│  window_title  TEXT                                     │
│  url           TEXT  NULL                               │
│  started_at    TIMESTAMPTZ                              │
│  ended_at      TIMESTAMPTZ                              │
│  duration_sec  INT                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  invites                                                │
│  ───────                                                │
│  id            UUID  PK                                 │
│  company_id    UUID  FK → companies.id                  │
│  email         TEXT                                     │
│  role          ENUM                                     │
│  token         TEXT  UNIQUE                             │
│  status        ENUM  (pending, accepted, expired)       │
│  created_at    TIMESTAMPTZ                              │
│  expires_at    TIMESTAMPTZ                              │
└─────────────────────────────────────────────────────────┘
`;

const EndpointCard = ({ ep }: { ep: Endpoint }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyPath = () => {
    navigator.clipboard.writeText(ep.path);
    setCopied(true);
    toast({ title: "Copied", description: ep.path });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/20 transition-colors text-left"
      >
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${methodColors[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm text-foreground font-mono flex-1">{ep.path}</code>
        {ep.auth && <Lock size={12} className="text-muted-foreground" />}
        {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border p-4 space-y-3 bg-card/50"
        >
          <p className="text-sm text-muted-foreground">{ep.desc}</p>
          <div className="flex gap-2">
            {ep.auth && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded">Requires Auth</span>
            )}
            <button onClick={copyPath} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              {copied ? <Check size={10} /> : <Copy size={10} />} Copy path
            </button>
          </div>

          {ep.request && (
            <div>
              <span className="text-xs font-medium text-foreground">Request</span>
              <pre className="mt-1 p-3 rounded-lg bg-secondary/50 text-xs text-foreground/80 overflow-x-auto font-mono whitespace-pre">{ep.request}</pre>
            </div>
          )}
          {ep.response && (
            <div>
              <span className="text-xs font-medium text-foreground">Response</span>
              <pre className="mt-1 p-3 rounded-lg bg-secondary/50 text-xs text-foreground/80 overflow-x-auto font-mono whitespace-pre">{ep.response}</pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const ApiSpecification = () => {
  const [showModels, setShowModels] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={22} className="text-primary" /> Desktop Agent API Specification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete API reference for the WEBMOK desktop tracking agent (Electron / Tauri).
          </p>
        </div>

        {/* Auth Flow Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-card border border-border p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Authentication Flow</h2>
          <div className="flex flex-wrap gap-2 items-center text-xs">
            {["Agent Launch", "→", "POST /api/auth/login", "→", "Receive JWT + plan_rules", "→", "Start Session", "→", "Heartbeat (60s)", "→", "Refresh Token (on 401)"].map((step, i) => (
              <span key={i} className={step === "→" ? "text-muted-foreground" : "px-2.5 py-1 rounded-lg bg-secondary text-foreground"}>
                {step}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong>Headers:</strong> <code className="text-foreground/80 ml-1">Authorization: Bearer {"<JWT>"}</code> on all authenticated endpoints.
            <br />
            <strong>Base URL:</strong> <code className="text-foreground/80 ml-1">https://api.webmok.com</code>
            <br />
            <strong>Multi-Tenancy:</strong> All data scoped by <code className="text-foreground/80">company_id</code> from JWT claims. No cross-company access.
          </div>
        </motion.div>

        {/* Endpoint Sections */}
        {sections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <span className="text-xs text-muted-foreground">— {section.description}</span>
            </div>
            <div className="space-y-2">
              {section.endpoints.map((ep) => (
                <EndpointCard key={ep.path + ep.method} ep={ep} />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Data Models */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setShowModels(!showModels)}
            className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3"
          >
            {showModels ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Data Models & Schema
          </button>
          {showModels && (
            <div className="rounded-xl bg-gradient-card border border-border p-5">
              <pre className="text-xs text-foreground/80 overflow-x-auto font-mono whitespace-pre">{dataModels}</pre>
            </div>
          )}
        </motion.div>

        {/* Agent Behaviour Notes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-gradient-card border border-border p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Agent Behaviour Notes</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Heartbeat:</strong> Every 60s with active window info. Missed 3+ heartbeats = auto-end session.</li>
            <li>• <strong className="text-foreground">Screenshots:</strong> 12/hr randomized (plan configurable). Uploaded immediately via multipart POST. Max 2MB per image.</li>
            <li>• <strong className="text-foreground">App Tracking:</strong> Batched every 5 minutes to reduce network calls. Entries include app name, window title, URL (for browsers), and duration.</li>
            <li>• <strong className="text-foreground">Idle Detection:</strong> No keyboard/mouse input for N minutes (configurable via plan_rules.idle_timeout_minutes). Agent reports idle start/end.</li>
            <li>• <strong className="text-foreground">Tray Icon:</strong> Runs in system tray. Cannot be closed by user—only "Pause Tracking" (admin-configurable).</li>
            <li>• <strong className="text-foreground">Auto-Start:</strong> Registers as startup application. Controlled by plan_rules.auto_start flag.</li>
            <li>• <strong className="text-foreground">Offline Queue:</strong> If network is unavailable, queue events locally and sync when connection resumes.</li>
            <li>• <strong className="text-foreground">Security:</strong> All communication over HTTPS. JWT tokens stored in OS keychain (not plain files). No third-party monitoring libraries.</li>
          </ul>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ApiSpecification;
