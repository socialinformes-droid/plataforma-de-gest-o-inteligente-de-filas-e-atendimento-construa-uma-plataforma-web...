import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Monitor, ListOrdered, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!loading && user) navigate("/app", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-muted via-background to-background">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FilaClínica</span>
        </div>
        <Button asChild variant="default">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Conforme LGPD · Multi-tenant · Tempo real
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Gestão inteligente de filas e atendimento clínico
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Plataforma híbrida para clínicas e laboratórios de exames ocupacionais. Mantém o atendimento por
            senha física e adiciona uma camada digital em tempo real para quem tem acesso.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              icon: ListOrdered,
              title: "Fila em tempo real",
              desc: "Atualização sob 2s via WebSocket. Operador chama, cliente acompanha pelo celular.",
            },
            {
              icon: Monitor,
              title: "Painel TV sincronizado",
              desc: "Mesma fonte de verdade do sistema digital, com chamada por voz integrada.",
            },
            {
              icon: ShieldCheck,
              title: "Multi-tenant seguro",
              desc: "Isolamento por clínica e empresa, RBAC com auditoria de ações sensíveis.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-clinical">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="container mx-auto border-t px-4 py-8 text-center text-xs text-muted-foreground">
        © {year} FilaClínica · Plataforma de gestão de filas
      </footer>
    </div>
  );
};

export default Index;
