import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Activity, ListOrdered, Monitor, Settings, LogOut, Users, Building2, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", label: "Visão geral", icon: Activity, end: true },
  { to: "/app/queue", label: "Fluxo Clínica", icon: ListOrdered },
  { to: "/app/schedule", label: "Agendamentos", icon: Calendar },
  { to: "/app/companies", label: "Fluxo Empresa", icon: Building2 },
  { to: "/app/tv", label: "Painel TV", icon: Monitor },
  { to: "/app/admin", label: "Administração", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut, clinicId, setClinicId, availableClinics } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b bg-sidebar lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FLUXO INTEGRA</span>
        </div>

        {availableClinics.length > 0 && (
          <div className="px-3 pb-3 lg:px-4">
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3 w-3" /> Clínica ativa
            </label>
            <Select value={clinicId ?? undefined} onValueChange={setClinicId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecionar clínica" />
              </SelectTrigger>
              <SelectContent>
                {availableClinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden flex-col gap-2 border-t p-4 lg:flex">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="truncate">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={async () => {
              await signOut();
              navigate("/auth");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
