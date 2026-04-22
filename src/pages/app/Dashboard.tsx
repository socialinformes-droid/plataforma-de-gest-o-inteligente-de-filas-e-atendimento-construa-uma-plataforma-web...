import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ListOrdered,
  Monitor,
  Settings,
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OccupancyRow {
  slot: string;
  hour_start: number;
  count: number;
  level: "livre" | "moderado" | "cheio";
}

export default function Dashboard() {
  const { clinicId, roles } = useAuth();
  const [waiting, setWaiting] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [avgDuration, setAvgDuration] = useState<number | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: queue } = await supabase
        .from("queues")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("date", today)
        .maybeSingle();

      const tasks: any[] = [];
      if (queue) {
        tasks.push(
          ...(["waiting", "in_progress", "done", "absent"] as const).map((s) =>
            Promise.resolve(
              supabase
                .from("queue_entries")
                .select("id", { count: "exact", head: true })
                .eq("queue_id", queue.id)
                .eq("status", s),
            ),
          ),
        );
      }
      tasks.push(
        Promise.resolve(
          supabase.from("attendance_logs").select("actual_duration").eq("clinic_id", clinicId).limit(50),
        ),
        Promise.resolve(supabase.rpc("get_day_occupancy", { _clinic_id: clinicId, _date: today })),
        Promise.resolve(
          supabase.from("companies").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        ),
        Promise.resolve(
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("clinic_id", clinicId)
            .gte("scheduled_at", `${today}T00:00:00`)
            .lt("scheduled_at", `${today}T23:59:59`),
        ),
      );

      const results = await Promise.all(tasks);
      let idx = 0;
      if (queue) {
        setWaiting(results[idx++].count ?? 0);
        setInProgress(results[idx++].count ?? 0);
        setDone(results[idx++].count ?? 0);
        setAbsent(results[idx++].count ?? 0);
      }
      const logs = (results[idx++].data ?? []) as { actual_duration: number }[];
      if (logs.length > 0) {
        setAvgDuration(Math.round(logs.reduce((sum, l) => sum + l.actual_duration, 0) / logs.length));
      }
      setOccupancy((results[idx++].data ?? []) as OccupancyRow[]);
      setCompanyCount(results[idx++].count ?? 0);
      setAppointmentCount(results[idx++].count ?? 0);
    })();
  }, [clinicId]);

  const total = done + waiting + inProgress + absent;
  const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;
  const maxCount = Math.max(1, ...occupancy.map((o) => o.count));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </header>

        {!clinicId && (
          <Card className="mb-6 border-warning/40 bg-warning/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
              <div className="text-sm">
                <p className="font-medium">Conta sem clínica vinculada</p>
                <p className="text-muted-foreground">
                  Selecione uma clínica no menu lateral ou peça ao super_admin para vincular sua conta.
                </p>
                {roles.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Nenhum papel atribuído.</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Aguardando" value={waiting} icon={Users} tone="primary" />
          <StatCard label="Em atendimento" value={inProgress} icon={Clock} tone="accent" />
          <StatCard label="Concluídos hoje" value={done} icon={CheckCircle2} tone="success" />
          <StatCard
            label="Tempo médio"
            value={avgDuration ?? 0}
            suffix="min"
            icon={TrendingUp}
            tone="primary"
          />
        </div>

        {/* Métricas operacionais */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SmallStatCard label="Taxa de ausência" value={`${absentRate}%`} hint={`${absent} ausentes`} />
          <SmallStatCard label="Empresas B2B" value={companyCount} hint="parceiras ativas" />
          <SmallStatCard label="Agendamentos hoje" value={appointmentCount} hint="entre agendados e realizados" />
        </div>

        {/* Mapa de calor de ocupação */}
        <Card className="mt-6 shadow-clinical">
          <CardHeader>
            <CardTitle className="text-base">Ocupação por faixa horária</CardTitle>
            <CardDescription>Distribuição dos agendamentos ao longo do dia</CardDescription>
          </CardHeader>
          <CardContent>
            {occupancy.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sem dados de ocupação ainda.</p>
            ) : (
              <div className="space-y-2">
                {occupancy.map((o) => (
                  <div key={o.slot} className="flex items-center gap-3">
                    <span className="ticket-display w-12 text-xs font-semibold text-muted-foreground">
                      {o.slot}
                    </span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all",
                          o.level === "livre" && "bg-success/70",
                          o.level === "moderado" && "bg-warning/70",
                          o.level === "cheio" && "bg-destructive/70",
                        )}
                        style={{ width: `${(o.count / maxCount) * 100}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-medium">
                        {o.count > 0 && `${o.count} agend.`}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "w-20 text-right text-xs font-medium capitalize",
                        o.level === "livre" && "text-success",
                        o.level === "moderado" && "text-warning",
                        o.level === "cheio" && "text-destructive",
                      )}
                    >
                      {o.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atalhos */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Atalhos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard to="/app/queue" icon={ListOrdered} title="Fila do dia" desc="Operar atendimentos em tempo real" />
            <ActionCard to="/app/schedule" icon={Calendar} title="Agendamentos" desc="Calendário e melhores horários" />
            <ActionCard to="/app/companies" icon={Building2} title="Empresas B2B" desc="Gestão e check-in/out" />
            <ActionCard to="/app/tv" icon={Monitor} title="Painel TV" desc="Modo recepção" />
            <ActionCard to="/app/admin" icon={Settings} title="Administração" desc="Tipos de exame e clínica" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: any;
  tone: "primary" | "accent" | "success";
}) {
  const toneClass = { primary: "text-primary", accent: "text-accent", success: "text-success" }[tone];
  const bgClass = { primary: "bg-primary/10", accent: "bg-accent/10", success: "bg-success/10" }[tone];
  return (
    <Card className="shadow-clinical">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgClass} ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={`ticket-display mt-3 text-3xl font-bold ${toneClass}`}>
          {value}
          {suffix && <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function SmallStatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="ticket-display mt-1 text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ActionCard({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Card className="shadow-clinical transition-shadow hover:shadow-clinical-lg">
      <CardContent className="p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{desc}</p>
        <Button asChild variant="outline" size="sm">
          <Link to={to}>Abrir</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
