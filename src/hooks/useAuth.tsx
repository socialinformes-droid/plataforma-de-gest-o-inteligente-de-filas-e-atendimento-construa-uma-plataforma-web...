import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "clinic_admin" | "operator" | "viewer" | "company_manager";

interface RoleEntry {
  role: AppRole;
  clinic_id: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: RoleEntry[];
  clinicId: string | null;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRoles([]);
        setClinicId(null);
      }
    });
    // Then fetch session
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
      const [{ data: rolesData }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role, clinic_id"),
        supabase.from("profiles").select("clinic_id").eq("id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setRoles((rolesData ?? []) as RoleEntry[]);
      setClinicId(profile?.clinic_id ?? rolesData?.[0]?.clinic_id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    roles,
    clinicId,
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
