"use client";

interface ExerciseGifProps {
  enName: string;
}

export default function ExerciseGif({ enName }: ExerciseGifProps) {
  const query = encodeURIComponent(`how to do ${enName} exercise proper form`);
  const url = `https://www.youtube.com/results?search_query=${query}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Ver tutorial: ${enName}`}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-gray-800 border border-gray-700 hover:border-red-500/40 hover:text-red-400 text-gray-500 transition-all text-xs"
    >
      ▷
    </a>
  );
}
