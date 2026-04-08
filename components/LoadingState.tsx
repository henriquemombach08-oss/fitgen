"use client";

const steps = [
  "Analisando perfil e objetivos",
  "Selecionando exercícios por padrão de movimento",
  "Calculando volume e intensidade",
  "Ajustando periodização",
  "Finalizando prescrição",
];

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      {/* Spinner minimalista */}
      <div className="relative w-10 h-10 mb-8">
        <div className="absolute inset-0 rounded-full" style={{ border: '1.5px solid rgba(255,255,255,0.06)' }} />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{ border: '1.5px solid transparent', borderTopColor: '#f97316', animationDuration: '0.8s' }}
        />
      </div>

      <p className="text-sm font-semibold mb-1" style={{ color: '#fafafa' }}>Gerando seu treino</p>
      <p className="text-xs mb-8" style={{ color: '#52525b' }}>Isso pode levar alguns segundos</p>

      {/* Progress bar */}
      <div className="w-48 h-px overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full animate-[loading_1.2s_ease-in-out_infinite]"
          style={{ width: '40%', background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }}
        />
      </div>

      {/* Steps */}
      <div className="h-5 overflow-hidden">
        <div className="flex flex-col animate-[scroll_6s_linear_infinite]">
          {[...steps, ...steps].map((step, i) => (
            <p key={i} className="h-5 flex items-center text-xs" style={{ color: '#52525b' }}>
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
