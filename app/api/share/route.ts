import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabaseServer = getSupabaseServer();
  try {
    const body = await request.json();
    const { workout, formData } = body;

    if (!workout || !formData) {
      return NextResponse.json(
        { error: "workout and formData are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("shared_workouts")
      .insert({ workout, form_data: formData })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save workout" },
        { status: 500 }
      );
    }

    // Build the share URL using the request host
    const host = request.headers.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const url = `${baseUrl}/share/${data.id}`;

    return NextResponse.json({ id: data.id, url });
  } catch (err) {
    console.error("Share route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
