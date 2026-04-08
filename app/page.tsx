"use client";

import { useState } from "react";
import WorkoutForm from "@/components/WorkoutForm";
import WorkoutResult from "@/components/WorkoutResult";
import WorkoutHistory from "@/components/WorkoutHistory";
import LoadingState from "@/components/LoadingState";
import AuthButton from "@/components/AuthButton";
import PersonalChat from "@/components/PersonalChat";
import WeeklyPlanCard from "@/components/WeeklyPlanCard";
import NutritionPanel from "@/components/NutritionPanel";
import ProgressStats from "@/components/ProgressStats";
import PhotoAnalysis from "@/components/PhotoAnalysis";
import Onboarding from "@/components/Onboarding";
import BodyTracker from "@/components/BodyTracker";
import UserProfile from "@/components/UserProfile";
import OneRMCalculator from "@/components/OneRMCalculator";
import MuscleRecoveryMap from "@/components/MuscleRecoveryMap";
import SupplementTracker from "@/components/SupplementTracker";
import { WorkoutFormData, Workout, GenerateResponse, SavedWorkout } from "@/types/workout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";

type AppState = "idle" | "loading" | "result" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [lastFormData, setLastFormData] = useState<WorkoutFormData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Agente 1 — Histórico
  const { saveWorkout, toggleFavorite } = useWorkoutHistory();
  const [currentSaved, setCurrentSaved] = useState<SavedWorkout | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  async function generateWorkout(data: WorkoutFormData) {
    setAppState("loading");
    setLastFormData(data);
    setErrorMsg("");
    setCurrentSaved(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: GenerateResponse = await res.json();

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? "Erro desconhecido. Tente novamente.");
        setAppState("error");
        return;
      }

      const generatedWorkout = json.workout!;
      setWorkout(generatedWorkout);
      setAppState("result");

      // Salvar automaticamente no histórico após gerar (falha silenciosa)
      try {
        const saved = await saveWorkout(generatedWorkout, data);
        setCurrentSaved(saved);
      } catch {
        // não bloqueia exibição do treino
      }
    } catch {
      setErrorMsg("Falha na conexão. Verifique sua internet e tente novamente.");
      setAppState("error");
    }
  }

  function handleRegenerate() {
    if (lastFormData) {
      generateWorkout(lastFormData);
    }
  }

  function handleReset() {
    setAppState("idle");
    setWorkout(null);
    setErrorMsg("");
    setCurrentSaved(null);
  }

  // Agente 1 — Carregar treino do histórico
  function handleLoadFromHistory(saved: SavedWorkout) {
    setWorkout(saved.workout);
    setLastFormData(saved.formData);
    setCurrentSaved(saved);
    setAppState("result");
  }

  // Agente 1 — Toggle favorito do treino atual
  function handleToggleFavorite() {
    if (!currentSaved) return;
    toggleFavorite(currentSaved.id);
    setCurrentSaved((prev) =>
      prev ? { ...prev, isFavorite: !prev.isFavorite } : prev
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Radial glow sutil */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse at top, rgba(249,115,22,0.04) 0%, transparent 70%)',
        }}
      />

      <Onboarding />

      {/* WorkoutHistory drawer */}
      <WorkoutHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onLoad={handleLoadFromHistory} />

      <div className="relative max-w-lg mx-auto px-4 py-10 pb-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f97316' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" strokeWidth="0"/>
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight" style={{ color: '#fafafa' }}>
                Fit<span style={{ color: '#f97316' }}>Gen</span>
              </span>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center gap-2">
              {/* Primary: Histórico */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                aria-label="Histórico" title="Histórico de treinos"
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#f97316'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>

              {/* Primary: Nutrição */}
              <NutritionPanel userProfile={lastFormData ? { level: lastFormData.level, goals: lastFormData.goals, equipment: lastFormData.equipment } : undefined} />

              {/* Primary: Plano semanal */}
              <WeeklyPlanCard userProfile={lastFormData ? { level: lastFormData.level, goals: lastFormData.goals.map(String), equipment: lastFormData.equipment } : undefined} />

              {/* Overflow: Ferramentas */}
              <div className="relative">
                <button
                  onClick={() => setToolsMenuOpen(v => !v)}
                  aria-label="Ferramentas" title="Ferramentas"
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
                  style={{ background: toolsMenuOpen ? 'rgba(249,115,22,0.10)' : '#141414', border: toolsMenuOpen ? '1px solid rgba(249,115,22,0.30)' : '1px solid rgba(255,255,255,0.06)', color: toolsMenuOpen ? '#f97316' : '#a1a1aa' }}
                  onMouseEnter={e => { if (!toolsMenuOpen) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#f97316'; } }}
                  onMouseLeave={e => { if (!toolsMenuOpen) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; } }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>
                  </svg>
                </button>

                {toolsMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setToolsMenuOpen(false)} />
                    {/* Dropdown panel */}
                    <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl p-3"
                      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', minWidth: '204px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                      <p className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: '#52525b' }}>Ferramentas</p>
                      {/* Grid 4 columns — each cell: button + label */}
                      <div className="grid grid-cols-4 gap-1" onClick={() => setToolsMenuOpen(false)}>
                        {[
                          { label: "Progresso",   node: <ProgressStats /> },
                          { label: "Recuperação", node: <MuscleRecoveryMap /> },
                          { label: "1RM",         node: <OneRMCalculator /> },
                          { label: "Análise",     node: <PhotoAnalysis userLevel={lastFormData?.level} exerciseNames={workout?.exercicios?.map(e => e.nome)} /> },
                          { label: "Medidas",     node: <BodyTracker /> },
                          { label: "Suplementos", node: <SupplementTracker /> },
                          { label: "Perfil",      node: <UserProfile /> },
                        ].map(({ label, node }) => (
                          <div key={label} className="flex flex-col items-center gap-1">
                            {node}
                            <span style={{ color: '#52525b', fontSize: '9px', lineHeight: 1 }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <AuthButton />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-sm" style={{ color: '#52525b' }}>
            Treinos personalizados por IA
          </p>
        </header>

        {/* Main content */}
        <main>
          {/* Accent line */}
          <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)' }} />

          {appState === 'idle' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1" style={{ color: '#fafafa' }}>Configure seu treino</h1>
                <p className="text-sm" style={{ color: '#52525b' }}>Preencha os campos e a IA monta o treino ideal para você.</p>
              </div>
              <WorkoutForm onSubmit={generateWorkout} isLoading={false} />
            </div>
          )}

          {appState === 'loading' && <LoadingState />}

          {appState === 'error' && (
            <div className="animate-fade-in space-y-6">
              <div className="rounded-2xl p-6 text-center" style={{ background: '#0f0f0f', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="font-semibold mb-1" style={{ color: '#f87171' }}>Algo deu errado</p>
                <p className="text-sm" style={{ color: '#52525b' }}>{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#f97316', color: 'white' }}
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {appState === 'result' && workout && lastFormData && (
            <div className="animate-fade-in">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm mb-6 transition-colors group"
                style={{ color: '#52525b' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Novo treino
              </button>
              <WorkoutResult
                workout={workout}
                formData={lastFormData}
                onRegenerate={handleRegenerate}
                isLoading={false}
                savedWorkout={currentSaved}
                onToggleFavorite={handleToggleFavorite}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs mt-10" style={{ color: '#27272a' }}>
            Groq · Llama 3.3 · FitGen v1.0
          </p>
        </main>
      </div>

      <PersonalChat userProfile={lastFormData ? { level: lastFormData.level, goals: lastFormData.goals.map(String) } : undefined} />
    </div>
  );
}
