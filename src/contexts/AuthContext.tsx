import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type AppRole =
  | "super_admin"
  | "company_admin"
  | "sub_admin"
  | "user";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  company_id: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (
    email: string,
    password: string,
    loginType: "super_admin" | "company_admin"
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://teamtreck-backend.onrender.com";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore Session */

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /* Login */

  const login = async (
    email: string,
    password: string,
    loginType: "super_admin" | "company_admin"
  ) => {
    try {
      let deviceId = localStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          device_id: deviceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      const backendRole = data.user.role;

      if (loginType === "super_admin" && backendRole !== "super_admin") {
        return {
          success: false,
          error: "Use Company Admin login for this account.",
        };
      }

      if (loginType === "company_admin" && backendRole === "super_admin") {
        return {
          success: false,
          error: "Use Super Admin portal for this account.",
        };
      }

      const userData: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        company_id: data.user.company_id || null,
      };

      setUser(userData);
      setToken(data.token);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      return { success: true };
    } catch (err) {
      return { success: false, error: "Server error" };
    }
  };

  /* Logout */

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};