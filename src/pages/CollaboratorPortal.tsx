import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Activity, Loader2, LogIn, LogOut, Clock, CheckCircle2, Calendar, Building2 } from "lucide-react";

interface CollabInfo {
  collaborator_id: string;
  collaborator_name: string;
  company_name: string;
  clinic_id: string;
  clinic_name: string;
  token_valid: boolean;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  exam_type_id: string;
  exam_type?: { name: string };
}

export default function CollaboratorPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [info, setInfo] = useState<CollabInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    const { data } = await supabase.rpc("get_collaborator_by_token", { _token: token });
    const row = (data ?? [])[0] as CollabInfo | undefined;
    if (!row || !row.token_valid) {
      setLoading(false);
      return;
    }
    setInfo(row);
    const { data: apps } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, check_in, check_out, exam_type_id, exam_type:exam_types(name)")
      .eq("collaborator_id", row.collaborator_id)
      .order("scheduled_at", { ascending: false })
      .limit(20);
    setAppointments((apps ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const checkIn = async (id: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("appointments")
      .update({ check_in: new Date().toISOString(), status: "checked_in" })
      .eq("id", id);
    setBusy(null);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Check-in registrado", description: "Boa sorte nos exames!" });
      load();
    }
  };

  const checkOut = async (id: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("appointments")
      .update({ check_out: new Date().toISOString(), status: "completed" })
      .eq("id", id);
    setBusy(null);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Check-out registrado", description: "Comprovante disponível para sua empresa." });
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="font-medium">Acesso inválido ou expirado</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Solicite um novo link de acesso ao RH da sua empresa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-muted via-background to-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-semibold">FLUXO VOCÊ · {info.clinic_name}</span>
        </div>

        <Card className="shadow-clinical-lg">
          <CardHeader>
            <CardTitle className="text-xl">Olá, {info.collaborator_name.split(" ")[0]}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {info.company_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Acompanhe seus exames, registre chegada e saída e reduza a incerteza sobre o tempo de permanência.
          </CardContent>
        </Card>

        <h2 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-4 w-4" /> Seus agendamentos
        </h2>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Você ainda não tem agendamentos. Entre em contato com sua empresa.
              </CardContent>
            </Card>
          ) : (
            appointments.map((a) => {
              const dur =
                a.check_in && a.check_out
                  ? Math.round((new Date(a.check_out).getTime() - new Date(a.check_in).getTime()) / 60000)
                  : null;
              return (
                <Card key={a.id} className="shadow-clinical">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{(a as any).exam_type?.name ?? "Exame"}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(a.scheduled_at).toLocaleString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    {(a.check_in || a.check_out) && (
                      <div className="mt-3 flex flex-wrap gap-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
                        {a.check_in && (
                          <span className="flex items-center gap-1">
                            <LogIn className="h-3 w-3 text-primary" />
                            Check-in: {new Date(a.check_in).toLocaleTimeString("pt-BR").slice(0, 5)}
                          </span>
                        )}
                        {a.check_out && (
                          <span className="flex items-center gap-1">
                            <LogOut className="h-3 w-3 text-success" />
                            Check-out: {new Date(a.check_out).toLocaleTimeString("pt-BR").slice(0, 5)}
                          </span>
                        )}
                        {dur !== null && (
                          <span className="ml-auto font-semibold">Permanência: {dur} min</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {!a.check_in && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => checkIn(a.id)}
                          disabled={busy === a.id}
                        >
                          {busy === a.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <LogIn className="mr-2 h-4 w-4" />
                          )}
                          Fazer check-in
                        </Button>
                      )}
                      {a.check_in && !a.check_out && (
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => checkOut(a.id)}
                          disabled={busy === a.id}
                        >
                          {busy === a.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                          )}
                          Finalizar atendimento
                        </Button>
                      )}
                      {a.check_out && (
                        <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-success/10 py-2 text-sm font-medium text-success">
                          <CheckCircle2 className="h-4 w-4" /> Concluído
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso seguro via link tokenizado · Sem cadastro de senha
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Agendado", cls: "" },
    checked_in: { label: "Check-in feito", cls: "border-primary/40 text-primary" },
    in_progress: { label: "Em atendimento", cls: "border-accent/40 text-accent" },
    completed: { label: "Concluído", cls: "border-success/40 text-success" },
    no_show: { label: "Faltou", cls: "border-destructive/40 text-destructive" },
    cancelled: { label: "Cancelado", cls: "text-muted-foreground" },
  };
  const m = map[status] ?? { label: status, cls: "" };
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}
