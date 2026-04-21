import { useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Sparkles, Loader2, AlertCircle, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OccupancyRow {
  slot: string;
  hour_start: number;
  count: number;
  level: "livre" | "moderado" | "cheio";
}

interface BestSlot {
  slot_time: string;
  hour_start: number;
  count: number;
}

interface ExamType {
  id: string;
  name: string;
  default_duration: number;
}

interface Collaborator {
  id: string;
  name: string;
}

export default function Schedule() {
  const { clinicId } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
  const [bestSlots, setBestSlots] = useState<BestSlot[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)),
    [],
  );
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const reload = async () => {
    if (!clinicId) return;
    setLoading(true);
    const [{ data: occ }, { data: best }, { data: exams }, { data: cols }] = await Promise.all([
      supabase.rpc("get_day_occupancy", { _clinic_id: clinicId, _date: dateStr }),
      supabase.rpc("suggest_best_slots", { _clinic_id: clinicId, _date: dateStr }),
      supabase
        .from("exam_types")
        .select("id, name, default_duration")
        .eq("clinic_id", clinicId)
        .eq("is_active", true),
      supabase.from("collaborators").select("id, name").eq("clinic_id", clinicId).order("name"),
    ]);
    setOccupancy((occ ?? []) as OccupancyRow[]);
    setBestSlots((best ?? []) as BestSlot[]);
    setExamTypes((exams ?? []) as ExamType[]);
    setCollaborators((cols ?? []) as Collaborator[]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, dateStr]);

  if (!clinicId) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm">Selecione uma clínica para gerenciar agendamentos.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const maxCount = Math.max(1, ...occupancy.map((o) => o.count));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agendamento inteligente</h1>
            <p className="text-sm text-muted-foreground">
              Calendário com indicação de ocupação e sugestão dos melhores horários
            </p>
          </div>
          <NewAppointmentDialog
            clinicId={clinicId}
            defaultDate={selectedDate}
            examTypes={examTypes}
            collaborators={collaborators}
            onSaved={reload}
          />
        </header>

        {/* Seletor de dias (próximos 7) */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const active = isSameDay(d, selectedDate);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "flex shrink-0 flex-col items-center rounded-lg border px-4 py-3 text-center transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-clinical"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <span className="text-[10px] font-semibold uppercase opacity-80">
                  {format(d, "EEE", { locale: ptBR })}
                </span>
                <span className="ticket-display mt-1 text-2xl font-bold">{format(d, "dd")}</span>
                <span className="text-[10px] opacity-80">{format(d, "MMM", { locale: ptBR })}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ocupação */}
            <Card className="shadow-clinical lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Ocupação · {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  Distribuição dos agendamentos por faixa horária (8h às 17h)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {occupancy.map((o) => (
                    <div key={o.slot} className="flex items-center gap-3">
                      <span className="ticket-display w-12 text-xs font-semibold text-muted-foreground">
                        {o.slot}
                      </span>
                      <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-md transition-all",
                            o.level === "livre" && "bg-success/70",
                            o.level === "moderado" && "bg-warning/70",
                            o.level === "cheio" && "bg-destructive/70",
                          )}
                          style={{ width: `${Math.max(4, (o.count / maxCount) * 100)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-medium">
                          {o.count > 0 ? `${o.count} agend.` : "—"}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-20 justify-center capitalize",
                          o.level === "livre" && "border-success/40 text-success",
                          o.level === "moderado" && "border-warning/40 text-warning",
                          o.level === "cheio" && "border-destructive/40 text-destructive",
                        )}
                      >
                        {o.level}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-4 border-t pt-4 text-xs">
                  <LegendDot color="bg-success/70" label="Livre (até 3 agend.)" />
                  <LegendDot color="bg-warning/70" label="Moderado (4–6)" />
                  <LegendDot color="bg-destructive/70" label="Cheio (7+)" />
                </div>
              </CardContent>
            </Card>

            {/* Melhores horários */}
            <Card className="shadow-clinical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Melhores horários
                </CardTitle>
                <CardDescription>Sugestão automática para esta data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bestSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
                ) : (
                  bestSlots.map((s, i) => (
                    <div
                      key={s.slot_time}
                      className="flex items-center justify-between rounded-lg border bg-accent/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <span className="ticket-display text-sm font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {String(s.hour_start).padStart(2, "0")}:00
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.count === 0 ? "Sem ocupação" : `${s.count} já agendado(s)`}
                          </p>
                        </div>
                      </div>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
                <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Recomendações baseadas na ocupação atual da agenda.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-sm", color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function NewAppointmentDialog({
  clinicId,
  defaultDate,
  examTypes,
  collaborators,
  onSaved,
}: {
  clinicId: string;
  defaultDate: Date;
  examTypes: ExamType[];
  collaborators: Collaborator[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [hour, setHour] = useState("09");
  const [examTypeId, setExamTypeId] = useState("");
  const [collaboratorId, setCollaboratorId] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => setDate(format(defaultDate, "yyyy-MM-dd")), [defaultDate]);

  const submit = async () => {
    if (!examTypeId) {
      toast({ title: "Selecione o tipo de exame", variant: "destructive" });
      return;
    }
    setSaving(true);
    const collaborator = collaborators.find((c) => c.id === collaboratorId);
    const { data: collab } = collaboratorId !== "none"
      ? await supabase.from("collaborators").select("company_id").eq("id", collaboratorId).maybeSingle()
      : { data: null };

    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      exam_type_id: examTypeId,
      collaborator_id: collaboratorId !== "none" ? collaboratorId : null,
      company_id: collab?.company_id ?? null,
      scheduled_at: `${date}T${hour}:00:00`,
      status: "scheduled",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agendamento criado" });
      setOpen(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 8).map((h) => (
                    <SelectItem key={h} value={String(h).padStart(2, "0")}>
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de exame</Label>
            <Select value={examTypeId} onValueChange={setExamTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.default_duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Colaborador (opcional)</Label>
            <Select value={collaboratorId} onValueChange={setCollaboratorId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo (cliente avulso)</SelectItem>
                {collaborators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
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
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
