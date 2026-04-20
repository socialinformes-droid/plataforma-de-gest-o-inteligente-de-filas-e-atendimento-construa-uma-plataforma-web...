import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodayQueue } from "@/hooks/useTodayQueue";
import { Activity } from "lucide-react";

export default function TVPanel() {
  const { clinicId } = useAuth();
  const { entries } = useTodayQueue(clinicId);
  const lastCalledRef = useRef<number | null>(null);

  const inProgress = entries.find((e) => e.status === "in_progress");
  const upcoming = entries.filter((e) => e.status === "waiting").slice(0, 5);

  useEffect(() => {
    if (!inProgress) return;
    if (lastCalledRef.current === inProgress.ticket_number) return;
    lastCalledRef.current = inProgress.ticket_number;
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(`Senha ${String(inProgress.ticket_number).padStart(3, "0")}`);
      u.lang = "pt-BR";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }, [inProgress]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">FilaClínica</span>
        </div>
        <div className="text-sm opacity-80">
          {new Date().toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-8 pb-12">
        <p className="text-2xl font-medium opacity-80">Senha chamada</p>
        <div className="my-8">
          {inProgress ? (
            <p className="ticket-display animate-pulse-call text-[14rem] font-bold leading-none">
              {String(inProgress.ticket_number).padStart(3, "0")}
            </p>
          ) : (
            <p className="ticket-display text-[10rem] font-bold leading-none opacity-40">---</p>
          )}
        </div>
        {inProgress?.client_name && <p className="text-3xl opacity-90">{inProgress.client_name}</p>}

        <div className="mt-16 w-full max-w-3xl">
          <p className="mb-3 text-center text-lg opacity-80">Próximas senhas</p>
          <div className="flex flex-wrap justify-center gap-3">
            {upcoming.length === 0 ? (
              <p className="opacity-60">—</p>
            ) : (
              upcoming.map((e) => (
                <div
                  key={e.id}
                  className="ticket-display rounded-xl bg-primary-foreground/15 px-6 py-3 text-3xl font-semibold"
                >
                  {String(e.ticket_number).padStart(3, "0")}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
