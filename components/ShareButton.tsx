"use client";

import { useState } from "react";
import { Workout, WorkoutFormData } from "@/types/workout";

type ShareState = "idle" | "loading" | "copied" | "error";

interface ShareButtonProps {
  workout: Workout;
  formData: WorkoutFormData;
}

export default function ShareButton({ workout, formData }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");

  async function handleShare() {
    if (state === "loading" || state === "copied") return;

    setState("loading");

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workout, formData }),
      });

      const json = await res.json();

      if (!res.ok || !json.url) {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
        return;
      }

      await navigator.clipboard.writeText(json.url);
      setState("copied");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={state === "loading" || state === "copied"}
      className="py-3.5 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 hover:border-orange-500/40 hover:bg-gray-750 text-gray-300 hover:text-orange-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {state === "idle" && (
        <span className="flex items-center justify-center gap-2">
          <span>🔗</span> Compartilhar
        </span>
      )}

      {state === "loading" && (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Gerando link...
        </span>
      )}

      {state === "copied" && (
        <span className="flex items-center justify-center gap-2 text-green-400">
          <span>✓</span> Link copiado!
        </span>
      )}

      {state === "error" && (
        <span className="flex items-center justify-center gap-2 text-red-400">
          <span>✗</span> Erro ao compartilhar
        </span>
      )}
    </button>
  );
}
