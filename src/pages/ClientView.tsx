import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Loader2, CheckCircle2, Clock, Users } from "lucide-react";

interface EntryView {
  ticket_number: number;
  status: "waiting" | "in_progress" | "done" | "absent";
  priority: "normal" | "elder" | "urgent";
  estimated_wait: number;
  exam_type_name: string;
  queue_position: number;
  ahead_count: number;
  clinic_name: string;
}

export default function ClientView() {
  const { token } = useParams<{ token: string }>();
  const [entry, setEntry] = useState<EntryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchEntry = async () => {
      const { data, error } = await supabase.rpc("get_entry_by_token", { _token: token });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setEntry(data[0] as EntryView);
      }
      setLoading(false);
    };
    fetchEntry();
    const interval = setInterval(fetchEntry, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="font-medium">Senha não encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground">Verifique o link ou peça uma nova senha na recepção.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-muted via-background to-background px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-semibold">{entry.clinic_name}</span>
        </div>

        <Card className="shadow-clinical-lg">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Sua senha</p>
            <p className="ticket-display my-2 text-7xl font-bold text-primary">
              {String(entry.ticket_number).padStart(3, "0")}
            </p>
            <p className="text-sm font-medium text-foreground">{entry.exam_type_name}</p>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-3">
          {entry.status === "in_progress" && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">É a sua vez!</p>
                  <p className="text-sm text-muted-foreground">Dirija-se ao atendimento.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {entry.status === "waiting" && (
            <>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pessoas à sua frente</p>
                    <p className="text-2xl font-semibold">{entry.ahead_count}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo estimado</p>
                    <p className="text-2xl font-semibold">~{entry.estimated_wait} min</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {entry.status === "done" && (
            <Card className="border-success/40 bg-success/5">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-success" />
                <p className="font-medium">Atendimento concluído</p>
              </CardContent>
            </Card>
          )}

          {entry.status === "absent" && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Senha marcada como ausente. Procure a recepção.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Atualiza automaticamente</p>
      </div>
    </div>
  );
}
