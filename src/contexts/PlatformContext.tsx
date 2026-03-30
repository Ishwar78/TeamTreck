import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({
  baseURL: `${API_BASE}/api/super-admin`,
});

export interface Plan {
  _id: string;
  id?: string;
  name: string;
  price_monthly: number;
  max_users: number;
  screenshots_per_hour: number;
  data_retention: string;
  isActive: boolean;
  features?: string[];
  active?: number;

  price?: number;
  users?: number | string;
  screenshots?: string;
  retention?: string;
  popular?: boolean;
}

export interface Company {
  _id: string;
  id?: string | number;
  name: string;
  email: string;
  plan: string;
  users: number;
  maxUsers: number;
  status: "active" | "trial" | "suspended";
  mrr: number;
  joined: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: string;
  lastSeen: string;
}

interface PlatformContextValue {
  plans: Plan[];
  companies: Company[];
  users: User[];
  loading: boolean;
  refreshData: () => void;

  addPlan: (plan: any) => Promise<void>;
  updatePlan: (id: string, updates: any) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  addCompany: (company: any) => Promise<void>;
  updateCompany: (id: string, updates: any) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  suspendCompany: (id: string) => Promise<void>;
  activateCompany: (id: string) => Promise<void>;

  deleteUser: (id: string) => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const [plansRes, companiesRes, usersRes] = await Promise.all([
        api.get("/plans"),
        api.get("/companies"),
        api.get("/users"),
      ]);

      if (plansRes.data.success) {
        const mappedPlans = plansRes.data.data.map((p: any) => ({
          ...p,
          id: p._id,
          price: p.price_monthly,
          users: p.max_users,
          screenshots: `${p.screenshots_per_hour}/hr`,
          retention: p.data_retention,
          popular: p.isPopular,
        }));

        setPlans(mappedPlans);
      }

      if (companiesRes.data.success) {
        setCompanies(companiesRes.data.data);
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch platform data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const addPlan = async (planData: any) => {
    const payload = {
      name: planData.name,
      price_monthly: planData.price,
      max_users: Number(planData.users) || 5,
      screenshots_per_hour: parseInt(planData.screenshots) || 12,
      data_retention: planData.retention,
      features: planData.features,
      isPopular: planData.popular,
      isActive: true,
    };

    await api.post("/plans", payload);
    fetchData();
  };

  const updatePlan = async (id: string, updates: any) => {
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.price !== undefined) mappedUpdates.price_monthly = Number(updates.price);
    if (updates.users !== undefined) mappedUpdates.max_users = Number(updates.users);
    if (updates.screenshots !== undefined) mappedUpdates.screenshots_per_hour = parseInt(updates.screenshots);
    if (updates.retention !== undefined) mappedUpdates.data_retention = updates.retention;
    if (updates.features !== undefined) mappedUpdates.features = updates.features;
    if (updates.popular !== undefined) mappedUpdates.isPopular = updates.popular;

    await api.put(`/plans/${id}`, mappedUpdates);
    fetchData();
  };

  const deletePlan = async (id: string) => {
    await api.delete(`/plans/${id}`);
    fetchData();
  };

  const addCompany = async (companyData: any) => {
    // Backend expects: { name, domain, adminEmail, adminPassword, plan_name, country }
    const payload = {
      name: companyData.name,
      domain: companyData.name.replace(/\s+/g, '').toLowerCase() + '.com', // mock domain based on name
      adminEmail: companyData.email,
      adminPassword: companyData.password,
      plan_name: companyData.plan,
      country: companyData.country || 'US'
    };
    await api.post("/company", payload);
    fetchData();
  };

  const updateCompany = async (id: string, updates: any) => {
    const mappedUpdates = { ...updates };
    if (mappedUpdates.plan) {
      mappedUpdates.plan_name = mappedUpdates.plan;
      delete mappedUpdates.plan;
    }
    await api.put(`/companies/${id}`, mappedUpdates);
    fetchData();
  };

  const deleteCompany = async (id: string) => {
    await api.delete(`/companies/${id}`);
    fetchData();
  };

  const suspendCompany = async (id: string) => {
    await api.put(`/companies/${id}`, { status: "suspended" });
    fetchData();
  };

  const activateCompany = async (id: string) => {
    await api.put(`/companies/${id}`, { status: "active" });
    fetchData();
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    fetchData();
  };

  return (
    <PlatformContext.Provider
      value={{
        plans,
        companies,
        users,
        loading,
        refreshData: fetchData,
        addPlan,
        updatePlan,
        deletePlan,
        addCompany,
        updateCompany,
        deleteCompany,
        suspendCompany,
        activateCompany,
        deleteUser,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
};