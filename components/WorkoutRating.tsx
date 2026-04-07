"use client";

import { useEffect, useState } from "react";
import StarRating from "./StarRating";

interface RatingEntry {
  rating: number;
  createdAt: string;
}

type RatingsMap = Record<string, RatingEntry>;

const STORAGE_KEY = "fitgen_ratings";

function getFeedbackMessage(rating: number): string {
  if (rating <= 2) return "Muito difícil? Tente reduzir a dificuldade 💪";
  if (rating === 3) return "Treino equilibrado! Continue assim 👍";
  return "Treino excelente! 🔥";
}

interface WorkoutRatingProps {
  workoutNome: string;
}

export default function WorkoutRating({ workoutNome }: WorkoutRatingProps) {
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const map: RatingsMap = JSON.parse(raw);
        if (map[workoutNome]) {
          setExistingRating(map[workoutNome].rating);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [workoutNome]);

  function handleSave(rating: number) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map: RatingsMap = raw ? JSON.parse(raw) : {};
      map[workoutNome] = { rating, createdAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      setExistingRating(rating);
      setSaved(true);
    } catch {
      // ignore
    }
  }

  if (existingRating !== null) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <StarRating value={existingRating} readonly size="md" />
        <p className="text-gray-500 text-xs">
          Você já avaliou este treino &mdash; {getFeedbackMessage(existingRating)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <StarRating value={pendingRating} onChange={setPendingRating} size="md" />
        {pendingRating > 0 && !saved && (
          <button
            onClick={() => handleSave(pendingRating)}
            className="text-xs font-semibold px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition-colors"
          >
            Avaliar
          </button>
        )}
      </div>
      {saved && existingRating === null && (
        <p className="text-green-400 text-xs">Avaliação salva!</p>
      )}
      {pendingRating === 0 && (
        <p className="text-gray-600 text-xs">Avalie este treino</p>
      )}
      {pendingRating > 0 && !saved && (
        <p className="text-gray-400 text-xs">{getFeedbackMessage(pendingRating)}</p>
      )}
    </div>
  );
}
