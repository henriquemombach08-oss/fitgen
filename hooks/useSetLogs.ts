"use client";

import { useState, useCallback } from "react";
import { SetLog } from "@/types/workout";

// exerciseIndex -> array of SetLog (one per completed set)
export type WorkoutLogs = Record<number, SetLog[]>;

const STORAGE_KEY_PREFIX = "fitgen_logs_";

function load(workoutKey: string): WorkoutLogs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workoutKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(workoutKey: string, logs: WorkoutLogs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${workoutKey}`, JSON.stringify(logs));
  } catch {
    // silently ignore quota errors
  }
}

export function useSetLogs(workoutKey: string) {
  const [logs, setLogs] = useState<WorkoutLogs>(() => load(workoutKey));

  const addLog = useCallback(
    (exerciseIndex: number, log: SetLog) => {
      setLogs((prev) => {
        const updated = {
          ...prev,
          [exerciseIndex]: [...(prev[exerciseIndex] ?? []), log],
        };
        persist(workoutKey, updated);
        return updated;
      });
    },
    [workoutKey]
  );

  const clearExerciseLogs = useCallback(
    (exerciseIndex: number) => {
      setLogs((prev) => {
        const updated = { ...prev, [exerciseIndex]: [] };
        persist(workoutKey, updated);
        return updated;
      });
    },
    [workoutKey]
  );

  return { logs, addLog, clearExerciseLogs };
}
