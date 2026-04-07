"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number>(0);

  const starSize = size === "sm" ? "text-lg" : "text-2xl";
  const isInteractive = !readonly && !!onChange;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered > 0 ? star <= hovered : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => isInteractive && onChange!(star)}
            onMouseEnter={() => isInteractive && setHovered(star)}
            onMouseLeave={() => isInteractive && setHovered(0)}
            className={`
              ${starSize}
              transition-all duration-150
              ${isInteractive ? "cursor-pointer hover:scale-110" : "cursor-default"}
              ${star === value && !hovered ? "scale-110 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]" : ""}
              disabled:cursor-default
            `}
            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          >
            <span
              className={`
                inline-block transition-colors duration-150
                ${filled
                  ? hovered > 0 && star <= hovered
                    ? "text-orange-400"
                    : "text-orange-500"
                  : "text-gray-600"
                }
              `}
            >
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
}
