import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "clinic_admin" | "operator" | "viewer" | "company_manager";

interface RoleEntry {
  role: AppRole;
  clinic_id: string | null;
}

interface ClinicOption {
  id: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: RoleEntry[];
  clinicId: string | null;
  setClinicId: (id: string) => void;
  availableClinics: ClinicOption[];
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [clinicId, setClinicIdState] = useState<string | null>(null);
  const [availableClinics, setAvailableClinics] = useState<ClinicOption[]>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRoles([]);
        setClinicIdState(null);
        setAvailableClinics([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: rolesData }, { data: profile }, { data: clinics }] = await Promise.all([
        supabase.from("user_roles").select("role, clinic_id"),
        supabase.from("profiles").select("clinic_id").eq("id", user.id).maybeSingle(),
        supabase.from("clinics").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      setRoles((rolesData ?? []) as RoleEntry[]);
      setAvailableClinics((clinics ?? []) as ClinicOption[]);
      const stored = localStorage.getItem("active_clinic_id");
      const fallback = profile?.clinic_id ?? rolesData?.find((r) => r.clinic_id)?.clinic_id ?? clinics?.[0]?.id ?? null;
      const initial = stored && clinics?.some((c) => c.id === stored) ? stored : fallback;
      setClinicIdState(initial);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setClinicId = (id: string) => {
    localStorage.setItem("active_clinic_id", id);
    setClinicIdState(id);
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    roles,
    clinicId,
    setClinicId,
    availableClinics,
    hasRole: (r) => roles.some((x) => x.role === r),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
