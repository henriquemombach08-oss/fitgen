"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface SetLog { weight: string; reps: string; note: string; }

export function useLoadProgression(exerciseNames: string[]) {
  const [previousLogs, setPreviousLogs] = useState<Record<string, SetLog[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseNames.length) { setLoading(false); return; }
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("workout_history")
        .select("workout, logs")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data) { setLoading(false); return; }

      const result: Record<string, SetLog[]> = {};
      for (const name of exerciseNames) {
        for (const row of data) {
          const exercises = (row.workout as any)?.exercicios ?? [];
          const idx = exercises.findIndex((e: any) => e.nome === name);
          if (idx !== -1) {
            const rowLogs = (row.logs as any)?.[idx];
            if (rowLogs && Array.isArray(rowLogs) && rowLogs.length > 0) {
              result[name] = rowLogs;
              break;
            }
          }
        }
      }
      setPreviousLogs(result);
      setLoading(false);
    }
    load();
  }, [exerciseNames.join(",")]);

  return { previousLogs, loading };
}
