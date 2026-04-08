"use client";

import { useRef, useState } from "react";

interface Props {
  userLevel?: string;
  exerciseNames?: string[];
}

interface UploadedPhoto {
  exerciseName: string;
  dataUrl: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export default function PhotoAnalysis({ userLevel, exerciseNames }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "loading" | "result">("upload");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>(
    exerciseNames?.[0] ?? ""
  );
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setOpen(true);
    setStep("upload");
    setPhotos([]);
    setSelectedExercise(exerciseNames?.[0] ?? "");
    setAnalysis("");
    setError("");
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = 3 - photos.length;
    const toProcess = files.slice(0, remaining);

    const newPhotos: UploadedPhoto[] = await Promise.all(
      toProcess.map(async (file) => ({
        exerciseName: selectedExercise,
        dataUrl: await fileToBase64(file),
      }))
    );

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 3));
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAnalyze() {
    if (!photos.length) return;
    if (!selectedExercise.trim()) {
      setError("Informe o nome do exercício.");
      return;
    }

    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/photo-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [{ exerciseName: selectedExercise, photos: photos.map((p) => p.dataUrl) }],
          level: userLevel ?? "Intermediário",
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Erro desconhecido. Tente novamente.");
        setStep("upload");
      } else {
        setAnalysis(json.analysis ?? "");
        setStep("result");
      }
    } catch {
      setError("Falha na conexão. Verifique sua internet e tente novamente.");
      setStep("upload");
    }
  }

  function handleReset() {
    setStep("upload");
    setPhotos([]);
    setSelectedExercise(exerciseNames?.[0] ?? "");
    setAnalysis("");
    setError("");
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center transition-all duration-150"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px",
          color: "#a1a1aa",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
          (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
        }}
        aria-label="Análise de Execução"
        title="Análise de Execução"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={handleClose}
          />

          {/* Modal card */}
          <div
            className="relative max-w-lg w-full mx-4 shadow-2xl max-h-[88vh] flex flex-col"
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "1rem",
              borderTop: "1px solid rgba(249,115,22,0.40)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "#fafafa" }}>
                Análise de Execução
              </h2>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-xs transition-colors"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "6px",
                  color: "#a1a1aa",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div
              className="px-5 py-4 flex-1"
              style={{ overflowY: "auto", scrollbarWidth: "none" }}
            >
              {/* Loading step */}
              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div
                    className="w-5 h-5 rounded-full animate-spin"
                    style={{
                      border: "2px solid rgba(255,255,255,0.08)",
                      borderTopColor: "#f97316",
                    }}
                  />
                  <p className="text-sm" style={{ color: "#52525b" }}>
                    Analisando execução...
                  </p>
                </div>
              )}

              {/* Upload step */}
              {step === "upload" && (
                <div className="space-y-5">
                  {/* Exercise selector / input */}
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "#a1a1aa" }}>
                      Exercício
                    </p>
                    {exerciseNames && exerciseNames.length > 0 ? (
                      <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                        style={{
                          background: "#141414",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#fafafa",
                          appearance: "none",
                        }}
                      >
                        {exerciseNames.map((name) => (
                          <option key={name} value={name} style={{ background: "#141414" }}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ex: Agachamento livre"
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                        style={{
                          background: "#141414",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#fafafa",
                        }}
                      />
                    )}
                  </div>

                  {/* File input (hidden) + upload button */}
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "#a1a1aa" }}>
                      Fotos ({photos.length}/3)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="photo-upload-input"
                    />
                    {photos.length < 3 && (
                      <label
                        htmlFor="photo-upload-input"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors"
                        style={{
                          background: "#141414",
                          border: "1px dashed rgba(255,255,255,0.10)",
                          color: "#a1a1aa",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLLabelElement).style.borderColor = "rgba(249,115,22,0.30)";
                          (e.currentTarget as HTMLLabelElement).style.color = "#f97316";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLLabelElement).style.borderColor = "rgba(255,255,255,0.10)";
                          (e.currentTarget as HTMLLabelElement).style.color = "#a1a1aa";
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Adicionar foto
                      </label>
                    )}
                  </div>

                  {/* Photo thumbnails */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group" style={{ aspectRatio: "1" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.dataUrl}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                            style={{
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full transition-colors"
                            style={{
                              background: "rgba(0,0,0,0.70)",
                              color: "#a1a1aa",
                              border: "1px solid rgba(255,255,255,0.10)",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.80)";
                              (e.currentTarget as HTMLButtonElement).style.color = "#fafafa";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.70)";
                              (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                            }}
                            aria-label="Remover foto"
                          >
                            ×
                          </button>
                          <div
                            className="absolute bottom-1 left-1 right-1 text-center truncate text-xs px-1 py-0.5 rounded"
                            style={{
                              background: "rgba(0,0,0,0.60)",
                              color: "#a1a1aa",
                            }}
                          >
                            {photo.exerciseName || "Sem nome"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.20)",
                      }}
                    >
                      <p className="text-xs" style={{ color: "#f87171" }}>
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Analyze button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={!photos.length || !selectedExercise.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity"
                    style={{
                      background: photos.length && selectedExercise.trim() ? "#f97316" : "#1a1a1a",
                      color: photos.length && selectedExercise.trim() ? "#fff" : "#52525b",
                      border: photos.length && selectedExercise.trim()
                        ? "none"
                        : "1px solid rgba(255,255,255,0.06)",
                      cursor: photos.length && selectedExercise.trim() ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => {
                      if (photos.length && selectedExercise.trim()) {
                        (e.currentTarget as HTMLButtonElement).style.opacity = "0.90";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    }}
                  >
                    Analisar
                  </button>
                </div>
              )}

              {/* Result step */}
              {step === "result" && (
                <div className="space-y-5">
                  {/* Analysis text */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "#141414",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="text-sm leading-relaxed"
                      style={{
                        color: "#a1a1aa",
                        whiteSpace: "pre-wrap",
                        maxHeight: "360px",
                        overflowY: "auto",
                        scrollbarWidth: "none",
                      }}
                    >
                      {analysis.split("\n").map((line, i) => {
                        const isPositive =
                          /correto|boa postura|excelente|parabéns|muito bem|certo|adequado|alinhado/i.test(
                            line
                          );
                        return (
                          <span
                            key={i}
                            style={isPositive ? { color: "#10b981" } : undefined}
                          >
                            {line}
                            {i < analysis.split("\n").length - 1 && "\n"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Analyze another photo button */}
                  <button
                    onClick={handleReset}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-opacity"
                    style={{
                      background: "rgba(249,115,22,0.10)",
                      border: "1px solid rgba(249,115,22,0.20)",
                      color: "#f97316",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(249,115,22,0.16)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(249,115,22,0.10)";
                    }}
                  >
                    Analisar outra foto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
