"use client";

import { useState, useEffect, useCallback } from "react";
import { SavedWorkout, Workout, WorkoutFormData } from "@/types/workout";

const STORAGE_KEY = "fitgen_history";
const MAX_ENTRIES = 20;

function readFromStorage(): SavedWorkout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedWorkout[];
  } catch {
    return [];
  }
}

function writeToStorage(entries: SavedWorkout[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // silently ignore quota errors
  }
}

export function useWorkoutHistory() {
  const [history, setHistory] = useState<SavedWorkout[]>([]);

  // Hydrate from localStorage only on the client
  useEffect(() => {
    setHistory(readFromStorage());
  }, []);

  const getHistory = useCallback((): SavedWorkout[] => {
    return [...history].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [history]);

  const saveWorkout = useCallback(
    (workout: Workout, formData: WorkoutFormData): SavedWorkout => {
      const newEntry: SavedWorkout = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        workout,
        formData,
        createdAt: new Date().toISOString(),
        isFavorite: false,
      };

      setHistory((prev) => {
        // Keep newest MAX_ENTRIES entries (prepend new, slice to limit)
        const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
        writeToStorage(updated);
        return updated;
      });

      return newEntry;
    },
    []
  );

  const toggleFavorite = useCallback((id: string): void => {
    setHistory((prev) => {
      const updated = prev.map((entry) =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      );
      writeToStorage(updated);
      return updated;
    });
  }, []);

  const deleteWorkout = useCallback((id: string): void => {
    setHistory((prev) => {
      const updated = prev.filter((entry) => entry.id !== id);
      writeToStorage(updated);
      return updated;
    });
  }, []);

  return {
    history,
    getHistory,
    saveWorkout,
    toggleFavorite,
    deleteWorkout,
  };
}
