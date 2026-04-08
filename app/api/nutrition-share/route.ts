import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { NutritionPlan } from "@/types/nutrition";

interface NutritionShareBody {
  plan: NutritionPlan;
  goal: string;
  dietType: string;
  bodyData: { weight: number; height: number; age: number; sex: string };
  trainingTime: string;
}

export async function POST(request: NextRequest) {
  const supabaseServer = getSupabaseServer();
  try {
    const body: NutritionShareBody = await request.json();
    const { plan, goal, dietType, bodyData, trainingTime } = body;

    if (!plan || !goal) {
      return NextResponse.json(
        { error: "plan and goal are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("shared_nutrition")
      .insert({
        plan,
        goal,
        diet_type: dietType,
        body_data: bodyData,
        training_time: trainingTime,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save nutrition plan" },
        { status: 500 }
      );
    }

    // Build the share URL using the request host
    const host = request.headers.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const url = `${baseUrl}/share/nutrition/${data.id}`;

    return NextResponse.json({ id: data.id, url });
  } catch (err) {
    console.error("Nutrition share route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
