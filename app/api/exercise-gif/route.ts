import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ gifUrl: null, debug: "no name" });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ gifUrl: null, debug: "no api key" });

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=3&offset=0`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    return NextResponse.json({
      gifUrl: Array.isArray(data) && (data as {gifUrl?: string}[])[0]?.gifUrl ? (data as {gifUrl: string}[])[0].gifUrl : null,
      debug: { status: res.status, dataType: typeof data, isArray: Array.isArray(data), length: Array.isArray(data) ? data.length : null, first: Array.isArray(data) && data.length > 0 ? data[0] : data }
    });
  } catch (e) {
    return NextResponse.json({ gifUrl: null, debug: { error: String(e) } });
  }
}
