import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("shared_workouts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  // Increment views (fire-and-forget)
  supabaseServer
    .from("shared_workouts")
    .update({ views: (data.views ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  return NextResponse.json({
    workout: data.workout,
    formData: data.form_data,
    views: (data.views ?? 0) + 1,
    createdAt: data.created_at,
  });
}
