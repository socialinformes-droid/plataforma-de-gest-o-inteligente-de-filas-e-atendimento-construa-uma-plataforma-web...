import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExamType {
  id: string;
  name: string;
  default_duration: number;
  average_duration: number | null;
  is_active: boolean;
}

export default function Admin() {
  const { clinicId, hasRole } = useAuth();
  const { toast } = useToast();
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<{ name: string; slug: string } | null>(null);

  const isAdmin = hasRole("clinic_admin") || hasRole("super_admin");

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: c }, { data: types }] = await Promise.all([
        supabase.from("clinics").select("name, slug").eq("id", clinicId).maybeSingle(),
        supabase.from("exam_types").select("*").eq("clinic_id", clinicId).order("name"),
      ]);
      setClinic(c);
      setExamTypes((types ?? []) as ExamType[]);
      setLoading(false);
    })();
  }, [clinicId]);

  const reload = async () => {
    if (!clinicId) return;
    const { data } = await supabase.from("exam_types").select("*").eq("clinic_id", clinicId).order("name");
    setExamTypes((data ?? []) as ExamType[]);
  };

  if (!clinicId) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardContent className="flex items-start gap-3 p-6">
              <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
              <div className="text-sm">
                <p className="font-medium">Sem clínica vinculada</p>
                <p className="text-muted-foreground">
                  Para usar a administração, sua conta precisa estar associada a uma clínica e ter um papel de admin.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
          <p className="text-sm text-muted-foreground">Configurações da clínica e tipos de exame</p>
        </header>

        {clinic && (
          <Card className="mb-6 shadow-clinical">
            <CardHeader>
              <CardTitle>{clinic.name}</CardTitle>
              <CardDescription>slug: {clinic.slug}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="shadow-clinical">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Tipos de exame</CardTitle>
              <CardDescription>Duração padrão e média móvel</CardDescription>
            </div>
            {isAdmin && <ExamTypeDialog clinicId={clinicId} onSaved={reload} />}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : examTypes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum tipo cadastrado. {isAdmin && "Crie o primeiro acima."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Padrão</TableHead>
                    <TableHead className="text-right">Média móvel</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-right">{t.default_duration} min</TableCell>
                      <TableCell className="text-right">{t.average_duration ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {t.is_active ? "Ativo" : "Inativo"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function ExamTypeDialog({ clinicId, onSaved }: { clinicId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("exam_types").insert({
      clinic_id: clinicId,
      name: name.trim(),
      default_duration: duration,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setOpen(false);
      setName("");
      setDuration(15);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Novo tipo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo tipo de exame</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Audiometria" />
          </div>
          <div className="space-y-2">
            <Label>Duração padrão (minutos)</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 15)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
