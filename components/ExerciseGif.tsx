"use client";

import { useState, useEffect, useRef } from "react";

interface ExerciseGifProps {
  enName: string;
}

export default function ExerciseGif({ enName }: ExerciseGifProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (images.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exercise-gif?name=${encodeURIComponent(enName)}`);
      const data = await res.json();
      setImages(data.images ?? []);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setFrameIndex((i) => (i + 1) % images.length);
      }, 700);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, images]);

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        title="Ver animação do exercício"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-gray-800 border border-gray-700 hover:border-orange-500/40 hover:text-orange-400 text-gray-500 transition-all text-xs"
      >
        ▷
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/60">
        <span className="text-xs text-gray-400 font-medium">{enName}</span>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-center min-h-[160px] p-3">
        {loading && (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs">Buscando animação...</span>
          </div>
        )}

        {!loading && images.length === 0 && (
          <p className="text-xs text-gray-600 text-center">
            Animação não encontrada para este exercício.
          </p>
        )}

        {!loading && images.length > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[frameIndex]}
            alt={enName}
            className="max-h-48 w-auto rounded-lg object-contain"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1 pb-2">
          {images.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === frameIndex ? "bg-orange-400" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
