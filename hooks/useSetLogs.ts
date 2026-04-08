"use client";

import { useState, useCallback } from "react";
import { SetLog } from "@/types/workout";

// exerciseIndex -> array of SetLog (one per set)
type WorkoutLogs = Record<number, SetLog[]>;

const STORAGE_KEY_PREFIX = "fitgen_logs_";

function emptyLog(): SetLog {
  return { weight: "", reps: "", note: "" };
}

function initLogs(workoutKey: string, exerciseSeries: number[]): WorkoutLogs {
  const defaults = Object.fromEntries(
    exerciseSeries.map((count, i) => [i, Array.from({ length: count }, emptyLog)])
  );

  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workoutKey}`);
    if (!raw) return defaults;
    const saved: WorkoutLogs = JSON.parse(raw);
    // Merge saved data with the expected structure
    return Object.fromEntries(
      exerciseSeries.map((count, i) => {
        const existing = saved[i] ?? [];
        return [i, Array.from({ length: count }, (_, j) => existing[j] ?? emptyLog())];
      })
    );
  } catch {
    return defaults;
  }
}

export function useSetLogs(workoutKey: string, exerciseSeries: number[]) {
  const [logs, setLogs] = useState<WorkoutLogs>(() =>
    initLogs(workoutKey, exerciseSeries)
  );

  const updateLog = useCallback(
    (exerciseIndex: number, setIndex: number, field: keyof SetLog, value: string) => {
      setLogs((prev) => {
        const exerciseLogs = [...(prev[exerciseIndex] ?? [])];
        exerciseLogs[setIndex] = { ...exerciseLogs[setIndex], [field]: value };
        const updated = { ...prev, [exerciseIndex]: exerciseLogs };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${workoutKey}`, JSON.stringify(updated));
          } catch {
            // silently ignore quota errors
          }
        }
        return updated;
      });
    },
    [workoutKey]
  );

  return { logs, updateLog };
}
