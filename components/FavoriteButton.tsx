"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  workoutId: string;
  isFavorite: boolean;
  onToggle: () => void;
}

export default function FavoriteButton({
  workoutId: _workoutId,
  isFavorite,
  onToggle,
}: FavoriteButtonProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  function handleClick() {
    setIsPulsing(true);
    onToggle();
    setTimeout(() => setIsPulsing(false), 400);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`
        relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200
        active:scale-90
        ${
          isFavorite
            ? "border-orange-500/40 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25"
            : "border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
        }
        ${isPulsing ? "scale-110" : "scale-100"}
      `}
    >
      <span
        className={`text-base leading-none transition-transform duration-200 ${
          isPulsing ? "scale-125" : "scale-100"
        }`}
      >
        {isFavorite ? "♥" : "♡"}
      </span>

      {/* Ripple pulse on click */}
      {isPulsing && (
        <span className="absolute inset-0 rounded-xl animate-ping bg-orange-500/20 pointer-events-none" />
      )}
    </button>
  );
}
