import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface QueueEntry {
  id: string;
  ticket_number: number;
  client_name: string | null;
  status: "waiting" | "in_progress" | "done" | "absent";
  priority: "normal" | "elder" | "urgent";
  estimated_wait: number;
  actual_start: string | null;
  actual_end: string | null;
  exam_type_id: string;
  public_token: string;
  created_at: string;
}

export interface ExamType {
  id: string;
  name: string;
  default_duration: number;
  average_duration: number | null;
}

export function useTodayQueue(clinicId: string | null) {
  const [queueId, setQueueId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<"open" | "paused" | "closed">("open");
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  const refresh = useCallback(async (qid: string) => {
    const { data } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("queue_id", qid)
      .order("priority", { ascending: false })
      .order("ticket_number", { ascending: true });
    setEntries((data ?? []) as QueueEntry[]);
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      // Get or create today's queue
      let { data: queue } = await supabase
        .from("queues")
        .select("id, status")
        .eq("clinic_id", clinicId)
        .eq("date", today)
        .maybeSingle();

      if (!queue) {
        const { data: created } = await supabase
          .from("queues")
          .insert({ clinic_id: clinicId, date: today })
          .select("id, status")
          .single();
        queue = created;
      }
      if (!queue || cancelled) return;
      setQueueId(queue.id);
      setQueueStatus(queue.status);

      const { data: types } = await supabase
        .from("exam_types")
        .select("id, name, default_duration, average_duration")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");
      setExamTypes((types ?? []) as ExamType[]);

      await refresh(queue.id);
      setLoading(false);

      channel = supabase
        .channel(`queue-${queue.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "queue_entries", filter: `queue_id=eq.${queue.id}` },
          () => refresh(queue!.id),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "queues", filter: `id=eq.${queue.id}` },
          (payload) => setQueueStatus((payload.new as any).status),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [clinicId, today, refresh]);

  return { queueId, queueStatus, entries, examTypes, loading, refresh };
}
