"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { Goal } from "@/types/workout";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface WorkoutHistoryRow {
  form_data: {
    goals?: Goal[];
  };
}

function UserCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getMostCommonGoal(rows: WorkoutHistoryRow[]): string {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const goals = row.form_data?.goals ?? [];
    for (const g of goals) {
      counts[g] = (counts[g] ?? 0) + 1;
    }
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return "—";
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export default function UserProfile() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [workoutCount, setWorkoutCount] = useState<number>(0);
  const [favoriteGoal, setFavoriteGoal] = useState<string>("—");
  const modalRef = useRef<HTMLDivElement>(null);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabase();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      setLoadingUser(false);
    }
    loadUser();
  }, []);

  // Load workout stats when modal opens and user is known
  useEffect(() => {
    if (!open || !user) return;

    async function loadStats() {
      const supabase = getSupabase();

      // Count
      const { count } = await supabase
        .from("workout_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      setWorkoutCount(count ?? 0);

      // Favorite goal — need form_data
      const { data: rows } = await supabase
        .from("workout_history")
        .select("form_data")
        .eq("user_id", user!.id)
        .limit(100);
      if (rows) {
        setFavoriteGoal(getMostCommonGoal(rows as WorkoutHistoryRow[]));
      }
    }

    loadStats();
  }, [open, user]);

  // Close modal on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function handleSignOut() {
    const confirmed = window.confirm("Tem certeza que deseja sair?");
    if (!confirmed) return;
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.reload();
  }

  const triggerButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#141414",
    color: "#a1a1aa",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
    padding: 0,
  };

  if (loadingUser) {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        aria-label="Perfil do usuário"
        onClick={() => setOpen((o) => !o)}
        style={triggerButtonStyle}
      >
        <UserCircleIcon />
      </button>

      {/* Backdrop + Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(0,0,0,0.50)",
            }}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Perfil do usuário"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 50,
              width: "100%",
              maxWidth: 384,
              borderRadius: 16,
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "1px solid rgba(249,115,22,0.40)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.70)",
              overflow: "hidden",
            }}
          >
            {user ? (
              <LoggedInContent
                user={user}
                workoutCount={workoutCount}
                favoriteGoal={favoriteGoal}
                onSignOut={handleSignOut}
                onClose={() => setOpen(false)}
              />
            ) : (
              <NotLoggedIn onClose={() => setOpen(false)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logged-in content
// ---------------------------------------------------------------------------

interface LoggedInContentProps {
  user: User;
  workoutCount: number;
  favoriteGoal: string;
  onSignOut: () => void;
  onClose: () => void;
}

function LoggedInContent({
  user,
  workoutCount,
  favoriteGoal,
  onSignOut,
  onClose,
}: LoggedInContentProps) {
  const email = user.email ?? "—";
  const initial = email[0].toUpperCase();
  const memberSince = user.created_at ? formatMemberSince(user.created_at) : "—";

  return (
    <div>
      {/* Close button row */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "12px 16px 0",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            background: "none",
            border: "none",
            color: "#52525b",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Header card */}
      <div
        style={{
          margin: "0 16px 16px",
          borderRadius: 12,
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          textAlign: "center",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 20,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          {initial}
        </div>

        {/* Email */}
        <p
          style={{
            color: "#fafafa",
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
            wordBreak: "break-all",
          }}
        >
          {email}
        </p>

        {/* Member since */}
        <p style={{ color: "#a1a1aa", fontSize: 12, margin: 0 }}>
          Membro desde: {memberSince}
        </p>

        {/* Active badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.20)",
            borderRadius: 20,
            padding: "3px 10px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>
            Conta ativa
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          margin: "0 16px 16px",
        }}
      >
        <StatCard label="Treinos gerados" value={String(workoutCount)} />
        <StatCard label="Objetivo favorito" value={favoriteGoal} small />
        <StatCard label="Sequência atual" value="0" unit="dias" />
      </div>

      {/* Preferences section */}
      <div
        style={{
          margin: "0 16px 16px",
          borderRadius: 12,
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 16px",
        }}
      >
        <p
          style={{
            color: "#a1a1aa",
            fontSize: 12,
            fontWeight: 600,
            margin: "0 0 6px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Preferencias
        </p>
        <p style={{ color: "#52525b", fontSize: 12, margin: 0 }}>
          Em breve: personalizacao de preferencias
        </p>
      </div>

      {/* Danger zone */}
      <div style={{ margin: "0 16px 20px" }}>
        <button
          onClick={onSignOut}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: 10,
            background: "#141414",
            border: "1px solid rgba(248,113,113,0.30)",
            color: "#f87171",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#141414";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.30)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  unit,
  small,
}: {
  label: string;
  value: string;
  unit?: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        textAlign: "center",
        minWidth: 0,
      }}
    >
      <span
        style={{
          color: "#f97316",
          fontSize: small ? 12 : 18,
          fontWeight: 700,
          lineHeight: 1,
          wordBreak: "break-word",
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2, color: "#a1a1aa" }}>
            {unit}
          </span>
        )}
      </span>
      <span style={{ color: "#52525b", fontSize: 10, lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not logged in
// ---------------------------------------------------------------------------

function NotLoggedIn({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ padding: "32px 24px", textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            background: "none",
            border: "none",
            color: "#52525b",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          color: "#52525b",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <p style={{ color: "#a1a1aa", fontSize: 14, margin: "0 0 20px" }}>
        Faca login para ver seu perfil
      </p>

      <a
        href="/login"
        style={{
          display: "inline-block",
          padding: "10px 24px",
          borderRadius: 10,
          background: "#f97316",
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
      >
        Fazer login
      </a>
    </div>
  );
}
