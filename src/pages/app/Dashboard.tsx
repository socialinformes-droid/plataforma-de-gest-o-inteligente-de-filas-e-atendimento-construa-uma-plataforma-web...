import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListOrdered, Monitor, Settings, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { clinicId, roles } = useAuth();
  const [waiting, setWaiting] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [done, setDone] = useState(0);

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
      if (!queue) return;
      const counts = await Promise.all(
        (["waiting", "in_progress", "done"] as const).map((s) =>
          supabase.from("queue_entries").select("id", { count: "exact", head: true }).eq("queue_id", queue.id).eq("status", s),
        ),
      );
      setWaiting(counts[0].count ?? 0);
      setInProgress(counts[1].count ?? 0);
      setDone(counts[2].count ?? 0);
    })();
  }, [clinicId]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground">Resumo do dia e atalhos rápidos</p>
        </header>

        {!clinicId && (
          <Card className="mb-6 border-warning/40 bg-warning/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
              <div className="text-sm">
                <p className="font-medium">Conta sem clínica vinculada</p>
                <p className="text-muted-foreground">
                  Você ainda não foi associado a uma clínica. Peça ao super_admin para vincular sua conta e atribuir um papel.
                </p>
                {roles.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Nenhum papel atribuído.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Aguardando" value={waiting} tone="primary" />
          <StatCard label="Em atendimento" value={inProgress} tone="accent" />
          <StatCard label="Concluídos hoje" value={done} tone="success" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ActionCard to="/app/queue" icon={ListOrdered} title="Painel da fila" desc="Gerenciar atendimentos" />
          <ActionCard to="/app/tv" icon={Monitor} title="Painel TV" desc="Modo recepção" />
          <ActionCard to="/app/admin" icon={Settings} title="Administração" desc="Configurar clínica" />
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "accent" | "success" }) {
  const toneClass = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
  }[tone];
  return (
    <Card className="shadow-clinical">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`ticket-display text-4xl font-bold ${toneClass}`}>{value}</p>
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
