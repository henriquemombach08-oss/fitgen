"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "fitgen-onboarded";

const LightningIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
  </svg>
);

const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

interface Step {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  pills: string[];
}

const STEPS: Step[] = [
  {
    icon: <LightningIcon />,
    iconBg: "#f97316",
    title: "Treinos personalizados por IA",
    description:
      "Configure seu nível, equipamento e objetivos. A IA monta um treino completo baseado em ciência do esporte em segundos.",
    pills: ["Iniciante a Competidor", "8+ equipamentos", "Periodização real"],
  },
  {
    icon: <LeafIcon />,
    iconBg: "#10b981",
    title: "Plano nutricional completo",
    description:
      "TDEE calculado por Mifflin-St Jeor, macros por Renaissance Periodization, calorie cycling e plano mensal periodizado. Suporta Keto, Vegano e mais.",
    pills: ["Calorie cycling", "Plano mensal", "Export PDF"],
  },
  {
    icon: <ChatIcon />,
    iconBg: "#7c3aed",
    title: "Personal IA disponível 24h",
    description:
      "Tire dúvidas sobre treino, nutrição, suplementação e recuperação a qualquer hora. O chat lembra suas conversas.",
    pills: ["Treino & nutrição", "Suplementação", "Recuperação"],
  },
];

export default function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        setVisible(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function complete() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      complete();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          maxWidth: "384px",
          width: "100%",
          borderRadius: "1rem",
          background: "#0f0f0f",
          borderTop: "1px solid rgba(249,115,22,0.40)",
          padding: "2rem",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "1rem",
            background: current.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          {current.icon}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#fafafa",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          {current.title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: "0.875rem",
            color: "#71717a",
            lineHeight: 1.6,
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          {current.description}
        </p>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          {current.pills.map((pill) => (
            <span
              key={pill}
              style={{
                fontSize: "0.75rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "9999px",
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#a1a1aa",
              }}
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Step dots */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={
                i === step
                  ? {
                      width: "20px",
                      height: "6px",
                      borderRadius: "9999px",
                      background: "#f97316",
                    }
                  : {
                      width: "6px",
                      height: "6px",
                      borderRadius: "9999px",
                      background: "rgba(255,255,255,0.10)",
                    }
              }
            />
          ))}
        </div>

        {/* Primary button */}
        <button
          onClick={handleNext}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "#f97316",
            color: "white",
            fontWeight: 600,
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isLast ? "Começar" : "Próximo"}
        </button>

        {/* Skip button */}
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button
            onClick={complete}
            style={{
              fontSize: "0.75rem",
              color: "#52525b",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#52525b")
            }
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  );
}
