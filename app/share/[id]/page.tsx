import { Metadata } from "next";
import Link from "next/link";
import { Workout, WorkoutFormData } from "@/types/workout";
import WorkoutResultReadonly from "@/components/WorkoutResultReadonly";

interface SharedWorkoutData {
  workout: Workout;
  formData: WorkoutFormData;
  views: number;
  createdAt: string;
}

async function getSharedWorkout(id: string): Promise<SharedWorkoutData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/share/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getSharedWorkout(id);

  if (!data) {
    return {
      title: "Treino não encontrado — FitGen",
    };
  }

  return {
    title: `${data.workout.nome} — FitGen`,
    description: data.workout.descricao,
    openGraph: {
      title: `${data.workout.nome} — FitGen`,
      description: data.workout.descricao,
      siteName: "FitGen",
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSharedWorkout(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">🔍</div>
          <h1 className="text-xl font-bold text-white">Treino não encontrado</h1>
          <p className="text-gray-500 text-sm">
            Este link pode ter expirado ou ser inválido.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:from-orange-400 hover:to-orange-500 transition-all"
          >
            Criar meu treino gratuitamente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-black tracking-tight text-white hover:opacity-80 transition-opacity">
              Fit<span className="text-orange-500">Gen</span>
            </h1>
          </Link>
        </header>

        {/* Shared badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-1.5 text-sm text-gray-400">
            <span>🔗</span>
            <span>Treino compartilhado</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">{data.views} visualizações</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600" />
          <div className="p-6">
            <WorkoutResultReadonly
              workout={data.workout}
              formData={data.formData}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
          <p className="text-white font-bold text-lg mb-1">
            Quer um treino personalizado?
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Crie o seu gratuitamente em segundos com IA.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/20 transition-all"
          >
            Criar meu treino gratuitamente
          </Link>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Powered by{" "}
          <span className="text-orange-500/60 font-semibold">Groq (Llama 3.3)</span>
          {" · "}
          <span className="text-gray-600">FitGen v1.0</span>
        </p>
      </div>
    </div>
  );
}
