import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Plus,
  Loader2,
  AlertCircle,
  Link2,
  Copy,
  Ban,
  Users,
  CheckCircle2,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  contact_email: string;
  cnpj: string | null;
  is_active: boolean;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  company_id: string;
}

interface Token {
  id: string;
  token: string;
  collaborator_id: string;
  expires_at: string;
  is_revoked: boolean;
  used_at: string | null;
}

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  collaborator_id: string | null;
  company_id: string | null;
}

export default function Companies() {
  const { clinicId } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!clinicId) return;
    setLoading(true);
    const [{ data: comps }, { data: cols }, { data: tks }, { data: apps }] = await Promise.all([
      supabase.from("companies").select("*").eq("clinic_id", clinicId).order("name"),
      supabase.from("collaborators").select("*").eq("clinic_id", clinicId).order("name"),
      supabase.from("collaborator_tokens").select("*").eq("clinic_id", clinicId),
      supabase
        .from("appointments")
        .select("id, scheduled_at, status, check_in, check_out, collaborator_id, company_id")
        .eq("clinic_id", clinicId)
        .not("company_id", "is", null)
        .order("scheduled_at", { ascending: false })
        .limit(50),
    ]);
    setCompanies((comps ?? []) as Company[]);
    setCollaborators((cols ?? []) as Collaborator[]);
    setTokens((tks ?? []) as Token[]);
    setAppointments((apps ?? []) as AppointmentRow[]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  if (!clinicId) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm">Selecione uma clínica.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Empresas B2B</h1>
          <p className="text-sm text-muted-foreground">Gestão de empresas parceiras, colaboradores e tokens de acesso</p>
        </header>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="companies">
            <TabsList>
              <TabsTrigger value="companies">Empresas ({companies.length})</TabsTrigger>
              <TabsTrigger value="collaborators">Colaboradores ({collaborators.length})</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard B2B</TabsTrigger>
            </TabsList>

            {/* COMPANIES */}
            <TabsContent value="companies" className="mt-4">
              <Card className="shadow-clinical">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">Empresas parceiras</CardTitle>
                    <CardDescription>Empresas que enviam colaboradores para exames ocupacionais</CardDescription>
                  </div>
                  <NewCompanyDialog clinicId={clinicId} onSaved={reload} />
                </CardHeader>
                <CardContent>
                  {companies.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nenhuma empresa cadastrada ainda.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>E-mail de contato</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead className="text-right">Colaboradores</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                {c.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{c.contact_email}</TableCell>
                            <TableCell className="text-muted-foreground">{c.cnpj ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              {collaborators.filter((co) => co.company_id === c.id).length}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* COLLABORATORS */}
            <TabsContent value="collaborators" className="mt-4">
              <Card className="shadow-clinical">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">Colaboradores</CardTitle>
                    <CardDescription>
                      Gere tokens individuais para que os colaboradores se autoatendam
                    </CardDescription>
                  </div>
                  <NewCollaboratorDialog clinicId={clinicId} companies={companies} onSaved={reload} />
                </CardHeader>
                <CardContent>
                  {collaborators.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum colaborador cadastrado.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Token</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collaborators.map((c) => {
                          const t = tokens.find(
                            (tk) => tk.collaborator_id === c.id && !tk.is_revoked && new Date(tk.expires_at) > new Date(),
                          );
                          const company = companies.find((cp) => cp.id === c.company_id);
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.name}</TableCell>
                              <TableCell className="text-muted-foreground">{company?.name ?? "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{c.email}</TableCell>
                              <TableCell>
                                {t ? (
                                  <Badge variant="outline" className="border-success/40 text-success">
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Inexistente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <TokenActions
                                  collaboratorId={c.id}
                                  clinicId={clinicId}
                                  activeToken={t}
                                  onChanged={reload}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* DASHBOARD B2B */}
            <TabsContent value="dashboard" className="mt-4">
              <Card className="shadow-clinical">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Atendimentos por colaborador
                  </CardTitle>
                  <CardDescription>
                    Tempo de permanência e status de cada agendamento corporativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum atendimento corporativo ainda.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Colaborador</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Agendado</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead className="text-right">Permanência</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((a) => {
                          const c = collaborators.find((co) => co.id === a.collaborator_id);
                          const cp = companies.find((co) => co.id === a.company_id);
                          const dur =
                            a.check_in && a.check_out
                              ? Math.round(
                                  (new Date(a.check_out).getTime() - new Date(a.check_in).getTime()) / 60000,
                                )
                              : null;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{c?.name ?? "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{cp?.name ?? "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(a.scheduled_at).toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell className="text-xs">
                                {a.check_in ? new Date(a.check_in).toLocaleTimeString("pt-BR").slice(0, 5) : "—"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {a.check_out
                                  ? new Date(a.check_out).toLocaleTimeString("pt-BR").slice(0, 5)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {dur !== null ? `${dur} min` : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <StatusBadge status={a.status} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Agendado", cls: "" },
    checked_in: { label: "Check-in", cls: "border-primary/40 text-primary" },
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

function TokenActions({
  collaboratorId,
  clinicId,
  activeToken,
  onChanged,
}: {
  collaboratorId: string;
  clinicId: string;
  activeToken?: Token;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    const { error } = await supabase.from("collaborator_tokens").insert({
      collaborator_id: collaboratorId,
      clinic_id: clinicId,
    });
    setGenerating(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Token gerado" });
      onChanged();
    }
  };

  const revoke = async () => {
    if (!activeToken) return;
    const { error } = await supabase
      .from("collaborator_tokens")
      .update({ is_revoked: true })
      .eq("id", activeToken.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Token revogado" });
      onChanged();
    }
  };

  const copyLink = () => {
    if (!activeToken) return;
    const url = `${window.location.origin}/c/${activeToken.token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado", description: url });
  };

  if (!activeToken) {
    return (
      <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
        {generating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        <Link2 className="mr-2 h-3 w-3" /> Gerar token
      </Button>
    );
  }
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={copyLink}>
        <Copy className="mr-1 h-3 w-3" /> Copiar link
      </Button>
      <Button variant="ghost" size="sm" onClick={revoke}>
        <Ban className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}

function NewCompanyDialog({ clinicId, onSaved }: { clinicId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("companies").insert({
      clinic_id: clinicId,
      name: name.trim(),
      contact_email: email.trim(),
      cnpj: cnpj.trim() || null,
    });
    setSaving(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      setOpen(false);
      setName("");
      setEmail("");
      setCnpj("");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nova empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova empresa parceira</DialogTitle>
          <DialogDescription>Cadastre uma empresa para enviar colaboradores aos exames.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>E-mail de contato</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ (opcional)</Label>
            <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} maxLength={18} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCollaboratorDialog({
  clinicId,
  companies,
  onSaved,
}: {
  clinicId: string;
  companies: Company[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !companyId) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("collaborators").insert({
      clinic_id: clinicId,
      company_id: companyId,
      name: name.trim(),
      email: email.trim(),
      cpf: cpf.trim() || null,
    });
    setSaving(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      setOpen(false);
      setName("");
      setEmail("");
      setCpf("");
      setCompanyId("");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={companies.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Novo colaborador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>CPF (opcional)</Label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} maxLength={14} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
