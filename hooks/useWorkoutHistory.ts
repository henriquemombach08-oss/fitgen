"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { SavedWorkout, Workout, WorkoutFormData } from "@/types/workout";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface DBRow {
  id: string;
  workout: Workout;
  form_data: WorkoutFormData;
  logs: Record<string, unknown>;
  rating: number | null;
  is_favorite: boolean;
  created_at: string;
}

function rowToSaved(row: DBRow): SavedWorkout {
  return {
    id: row.id,
    workout: row.workout,
    formData: row.form_data,
    createdAt: row.created_at,
    isFavorite: row.is_favorite,
    rating: row.rating ?? undefined,
  };
}

export function useWorkoutHistory() {
  const [history, setHistory] = useState<SavedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getClient();
      const { data } = await supabase
        .from("workout_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setHistory((data as DBRow[]).map(rowToSaved));
      setLoading(false);
    }
    load();
  }, []);

  const getHistory = useCallback((): SavedWorkout[] => history, [history]);

  const saveWorkout = useCallback(
    async (workout: Workout, formData: WorkoutFormData): Promise<SavedWorkout> => {
      const supabase = getClient();
      const { data, error } = await supabase
        .from("workout_history")
        .insert({ workout, form_data: formData, logs: {} })
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Erro ao salvar treino");
      const saved = rowToSaved(data as DBRow);
      setHistory((prev) => [saved, ...prev]);
      return saved;
    },
    []
  );

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const supabase = getClient();
    const entry = history.find((h) => h.id === id);
    if (!entry) return;
    const newVal = !entry.isFavorite;
    await supabase.from("workout_history").update({ is_favorite: newVal }).eq("id", id);
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isFavorite: newVal } : h))
    );
  }, [history]);

  const deleteWorkout = useCallback(async (id: string): Promise<void> => {
    const supabase = getClient();
    await supabase.from("workout_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const setRating = useCallback(async (id: string, rating: number): Promise<void> => {
    const supabase = getClient();
    await supabase.from("workout_history").update({ rating }).eq("id", id);
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, rating } : h))
    );
  }, []);

  return { history, loading, getHistory, saveWorkout, toggleFavorite, deleteWorkout, setRating };
}
