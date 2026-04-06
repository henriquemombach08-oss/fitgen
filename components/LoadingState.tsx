"use client";

const tips = [
  "Montando sua sequência de exercícios...",
  "Calculando volume e intensidade...",
  "Ajustando tempos de descanso...",
  "Selecionando as melhores dicas de execução...",
  "Finalizando seu treino personalizado...",
];

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-fade-in">
      {/* Anel animado */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-orange-400 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-transparent border-b-orange-500/40 border-l-orange-500/40 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          🏋️
        </div>
      </div>

      {/* Texto principal */}
      <div className="text-center space-y-2">
        <p className="text-white font-bold text-lg">IA gerando seu treino</p>
        <p className="text-gray-400 text-sm">Isso pode levar alguns segundos...</p>
      </div>

      {/* Barra de progresso indeterminada */}
      <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Dicas rotativas */}
      <div className="h-6 overflow-hidden">
        <div className="flex flex-col animate-[scroll_7.5s_linear_infinite]">
          {[...tips, ...tips].map((tip, i) => (
            <p
              key={i}
              className="h-6 flex items-center text-xs text-gray-500 text-center"
            >
              {tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
