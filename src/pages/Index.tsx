import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Monitor,
  ListOrdered,
  ShieldCheck,
  Calendar,
  Building2,
  TrendingUp,
  Eye,
  Brain,
  HeartHandshake,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!loading && user) navigate("/app", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FilaClínica</span>
          </div>
          <Button asChild>
            <Link to="/auth">
              Acessar plataforma <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-muted via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Inclusão digital · Tempo real · Multi-tenant LGPD
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              A espera deixa de ser um mistério.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              Plataforma inteligente de gestão de filas, agendamentos e devolutiva de exames para clínicas e
              laboratórios. Transforma incerteza em <strong className="text-foreground">previsibilidade</strong>,
              ansiedade em <strong className="text-foreground">controle</strong> e atendimento em{" "}
              <strong className="text-foreground">confiança</strong>.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#problema">Conhecer a proposta</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">O problema</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            A dor não é esperar — é não saber quanto vai esperar.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Quando o cliente se programa para ficar 2h e enfrenta 4h sem nenhuma comunicação, o que se gera não é
            só desconforto: é frustração, quebra de confiança e abandono. A falta de previsibilidade gera picos
            desorganizados, ociosidade em outros horários e sobrecarga operacional.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            { icon: Clock, title: "Espera sem fim visível", desc: "Cliente não sabe quanto falta." },
            { icon: Users, title: "Abandono de fila", desc: "Vai embora e não volta." },
            { icon: TrendingUp, title: "Picos descontrolados", desc: "Concentração nos horários errados." },
          ].map((p) => (
            <Card key={p.title} className="border-destructive/20">
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SOLUÇÃO — 3 PILARES */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">A solução</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Três pilares que reorganizam a experiência de atendimento
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "1. Previsibilidade antes da chegada",
                desc: "Colaborador recebe link, escolhe entre os 3 melhores horários do dia (com base em ocupação real), vê o checklist de exames e a duração estimada total.",
              },
              {
                icon: Eye,
                title: "2. Transparência em tempo real",
                desc: "Posição na fila, tempo restante atualizado a cada segundo, status visível pelo celular. Se algo atrasar, o cliente sabe — sem precisar perguntar na recepção.",
              },
              {
                icon: Brain,
                title: "3. Inteligência adaptativa",
                desc: "O sistema aprende com cada atendimento, recalcula a média móvel por exame, detecta gargalos e ajusta toda a fila em cascata quando algo foge do padrão.",
              },
            ].map((s) => (
              <Card key={s.title} className="border-primary/20 shadow-clinical-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS APROFUNDADOS */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Diferenciais</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">O que torna isso único</h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5">
          {[
            {
              n: "01",
              title: "Previsão dinâmica baseada em comportamento real",
              desc: "Diferente de sistemas tradicionais com tempo fixo (ex: 15 min por atendimento), nossa estimativa nasce padrão e migra progressivamente para a média móvel dos últimos 30 atendimentos do mesmo tipo de exame, considerando variações por dia da semana e período do dia.",
            },
            {
              n: "02",
              title: "Sistema adaptativo em tempo real",
              desc: "Se um atendimento ultrapassa 1,5× o tempo médio, o operador recebe alerta e o desvio é registrado como evento operacional. As estimativas de toda a fila são recalculadas em cascata e os clientes conectados são notificados — antes mesmo de perceberem que algo mudou.",
            },
            {
              n: "03",
              title: "Distribuição inteligente da demanda (anti-pico)",
              desc: "O sistema analisa a ocupação histórica e atual e sugere os 3 melhores horários para o próximo agendamento. O cliente escolhe entre verde (livre), amarelo (moderado) e vermelho (cheio) — sem precisar entender de operação.",
            },
            {
              n: "04",
              title: "Integração B2B com rastreabilidade total",
              desc: "Empresas geram tokens individuais para colaboradores, recebem dashboard em tempo real do tempo de permanência e exportam relatórios. Justifica formalmente a ausência do funcionário e gera dados para otimizar futuras marcações.",
            },
            {
              n: "05",
              title: "Devolutiva digital LGPD-compliant",
              desc: "Resultados de exames são acessados via links assinados de 1 hora, nunca URLs públicas. Configurável por tipo de exame: visibilidade para a empresa, exigência de confirmação de leitura, prazo de retenção. Todo acesso registrado em log append-only.",
            },
          ].map((d) => (
            <Card key={d.n} className="shadow-clinical">
              <CardContent className="flex gap-5 p-6">
                <div className="ticket-display shrink-0 text-3xl font-bold text-primary/40">{d.n}</div>
                <div>
                  <h3 className="font-semibold">{d.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* INCLUSÃO DIGITAL */}
      <section className="bg-gradient-to-br from-accent/5 via-background to-primary-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Princípio fundamental
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Inclusão digital: ninguém fica de fora.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                A plataforma <strong className="text-foreground">não substitui</strong> o atendimento por ficha
                ou nome — ela <strong className="text-foreground">integra e potencializa</strong>. Quem não tem
                celular, internet ou letramento digital continua sendo atendido normalmente. Quem usa a camada
                digital se autoatende e, com isso, libera a recepção para focar justamente em quem precisa de
                suporte humano.
              </p>
              <p className="mt-4 italic text-foreground">
                "O sistema não substitui o atendimento tradicional — ele cria uma camada de inteligência que
                melhora a experiência de quem pode usar, sem excluir quem não pode."
              </p>
            </div>
            <Card className="shadow-clinical-lg">
              <CardContent className="space-y-4 p-6">
                {[
                  { icon: HeartHandshake, title: "Acessibilidade", desc: "Ninguém fica de fora do processo." },
                  {
                    icon: TrendingUp,
                    title: "Eficiência operacional",
                    desc: "Quem se autoatende reduz fluxo manual.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Adoção fácil",
                    desc: "A clínica não rompe com o modelo atual.",
                  },
                ].map((b) => (
                  <div key={b.title} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <b.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{b.title}</p>
                      <p className="text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES POR PERFIL */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Funcionalidades</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Uma plataforma para cada perfil de usuário
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
          <FeatureCard
            icon={Users}
            tone="primary"
            title="Para o cliente"
            items={[
              "Acompanhamento da fila em tempo real",
              "Estimativa de espera dinâmica",
              "Visualização das etapas do atendimento",
              "Agendamento com sugestão de melhores horários",
              "Acesso antecipado ao checklist de exames",
            ]}
          />
          <FeatureCard
            icon={Building2}
            tone="accent"
            title="Para empresas (B2B)"
            items={[
              "Disparo automatizado de tokens individuais",
              "Check-in e check-out digital",
              "Dashboard de colaboradores em tempo real",
              "Relatórios de tempo de permanência",
              "Inteligência de melhores horários para agendar",
            ]}
          />
          <FeatureCard
            icon={ListOrdered}
            tone="primary"
            title="Para a clínica"
            items={[
              "Painel de gestão da fila + chamada por voz",
              "Painel TV sincronizado com o digital",
              "Controle de etapas e prioridades",
              "Identificação de gargalos em tempo real",
              "Relatórios de desempenho e ocupação",
            ]}
          />
        </div>
      </section>

      {/* RESULTADO ESPERADO */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Resultado esperado</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Mais do que organizar filas — reorganizar a experiência.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Para o cliente: redução da ansiedade, fim da sensação de estar perdido. Para a empresa: controle e
              previsibilidade da ausência do colaborador. Para a clínica: melhoria na gestão de capacidade,
              redução de abandono e aumento da fidelização — consolidando um diferencial competitivo real.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to="/auth">
                  Acessar a plataforma <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="container mx-auto border-t px-4 py-8 text-center text-xs text-muted-foreground">
        © {year} FilaClínica · Plataforma de gestão inteligente de filas e atendimento
      </footer>
    </div>
  );
};

function FeatureCard({
  icon: Icon,
  tone,
  title,
  items,
}: {
  icon: any;
  tone: "primary" | "accent";
  title: string;
  items: string[];
}) {
  const toneBg = tone === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";
  return (
    <Card className="shadow-clinical">
      <CardContent className="p-6">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${toneBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <ul className="mt-4 space-y-2">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default Index;
