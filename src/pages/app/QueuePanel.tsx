import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTodayQueue, QueueEntry } from "@/hooks/useTodayQueue";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Play, CheckCircle2, UserX, Plus, Pause, AlertCircle, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QueuePanel() {
  const { clinicId, user } = useAuth();
  const { toast } = useToast();
  const { queueId, queueStatus, entries, examTypes, loading } = useTodayQueue(clinicId);

  const waiting = useMemo(() => entries.filter((e) => e.status === "waiting"), [entries]);
  const inProgress = useMemo(() => entries.filter((e) => e.status === "in_progress"), [entries]);
  const recent = useMemo(
    () => entries.filter((e) => e.status === "done" || e.status === "absent").slice(-10).reverse(),
    [entries],
  );

  if (!clinicId) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm">Você precisa estar vinculado a uma clínica para operar a fila.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const callNext = async () => {
    const next = waiting[0];
    if (!next || !queueId) return;
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "in_progress", actual_start: new Date().toISOString() })
      .eq("id", next.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else announce(next.ticket_number);
  };

  const finish = async (id: string) => {
    await supabase.from("queue_entries").update({ status: "done", actual_end: new Date().toISOString() }).eq("id", id);
  };

  const markAbsent = async (id: string) => {
    await supabase.from("queue_entries").update({ status: "absent" }).eq("id", id);
  };

  const togglePause = async () => {
    if (!queueId) return;
    const newStatus = queueStatus === "paused" ? "open" : "paused";
    await supabase.from("queues").update({ status: newStatus }).eq("id", queueId);
    if (newStatus === "paused" && user) {
      await supabase.from("operational_events").insert({
        queue_id: queueId,
        clinic_id: clinicId,
        type: "pause",
        impact_minutes: 0,
        recorded_by: user.id,
      });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fluxo Clínica</h1>
            <p className="text-sm text-muted-foreground">
              Gestão da fila, presença, gargalos e atendimento em tempo real · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={queueStatus === "open" ? "default" : "secondary"}>
              {queueStatus === "open" ? "Fila aberta" : queueStatus === "paused" ? "Pausada" : "Encerrada"}
            </Badge>
            <Button variant="outline" size="sm" onClick={togglePause}>
              <Pause className="mr-2 h-4 w-4" />
              {queueStatus === "paused" ? "Retomar" : "Pausar"}
            </Button>
            <NewEntryDialog
              queueId={queueId!}
              clinicId={clinicId}
              examTypes={examTypes}
              nextTicket={(entries.at(-1)?.ticket_number ?? 0) + 1}
            />
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* In-progress + call */}
          <Card className="shadow-clinical lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum atendimento ativo</p>
              ) : (
                inProgress.map((e) => (
                  <div key={e.id} className="rounded-lg border bg-primary-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="ticket-display text-3xl font-bold text-primary">
                        {String(e.ticket_number).padStart(3, "0")}
                      </span>
                      <PriorityBadge priority={e.priority} />
                    </div>
                    {e.client_name && <p className="mt-1 text-sm font-medium">{e.client_name}</p>}
                    <Button size="sm" className="mt-3 w-full" onClick={() => finish(e.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </div>
                ))
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={callNext}
                disabled={waiting.length === 0 || queueStatus !== "open"}
              >
                <Play className="mr-2 h-4 w-4" /> Chamar próximo
              </Button>
            </CardContent>
          </Card>

          {/* Waiting list */}
          <Card className="shadow-clinical lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aguardando ({waiting.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {waiting.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sem ninguém aguardando</p>
              ) : (
                <ul className="divide-y">
                  {waiting.map((e, idx) => (
                    <li key={e.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "ticket-display w-16 text-2xl font-bold",
                            idx === 0 ? "text-primary" : "text-foreground",
                          )}
                        >
                          {String(e.ticket_number).padStart(3, "0")}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{e.client_name ?? "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">
                            {examTypes.find((t) => t.id === e.exam_type_id)?.name ?? "—"} · ~{e.estimated_wait} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={e.priority} />
                        <Button variant="ghost" size="sm" onClick={() => markAbsent(e.id)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent */}
        <Card className="mt-4 shadow-clinical">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimos finalizados</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum atendimento finalizado ainda</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recent.map((e) => (
                  <Badge
                    key={e.id}
                    variant={e.status === "done" ? "secondary" : "outline"}
                    className="ticket-display text-base"
                  >
                    {String(e.ticket_number).padStart(3, "0")}
                    {e.status === "absent" && " ✕"}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function PriorityBadge({ priority }: { priority: QueueEntry["priority"] }) {
  if (priority === "normal") return null;
  return (
    <Badge variant={priority === "urgent" ? "destructive" : "secondary"} className="gap-1">
      <Crown className="h-3 w-3" />
      {priority === "elder" ? "Idoso" : "Urgente"}
    </Badge>
  );
}

function announce(ticket: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const text = `Senha ${String(ticket).padStart(3, "0")}`;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function NewEntryDialog({
  queueId,
  clinicId,
  examTypes,
  nextTicket,
}: {
  queueId: string;
  clinicId: string;
  examTypes: { id: string; name: string; default_duration: number; average_duration: number | null }[];
  nextTicket: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [examTypeId, setExamTypeId] = useState<string>("");
  const [priority, setPriority] = useState<"normal" | "elder" | "urgent">("normal");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!examTypeId) {
      toast({ title: "Selecione o tipo de exame", variant: "destructive" });
      return;
    }
    setSaving(true);
    const exam = examTypes.find((t) => t.id === examTypeId);
    const wait = exam?.average_duration ?? exam?.default_duration ?? 15;
    const { error } = await supabase.from("queue_entries").insert({
      queue_id: queueId,
      clinic_id: clinicId,
      ticket_number: nextTicket,
      client_name: name || null,
      phone: phone || null,
      exam_type_id: examTypeId,
      priority,
      estimated_wait: wait,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setOpen(false);
      setName("");
      setPhone("");
      setExamTypeId("");
      setPriority("normal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={examTypes.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Nova senha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova senha · #{String(nextTicket).padStart(3, "0")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de exame</Label>
            <Select value={examTypeId} onValueChange={setExamTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (~{t.average_duration ?? t.default_duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nome (opcional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone (opcional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="elder">Idoso</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar à fila
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
