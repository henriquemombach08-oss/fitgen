import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ images: [] });

  try {
    const searchRes = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(name)}&language=english&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!searchRes.ok) return NextResponse.json({ images: [] });

    const searchData = await searchRes.json();
    const baseId = searchData.suggestions?.[0]?.data?.base_id;
    if (!baseId) return NextResponse.json({ images: [] });

    const imagesRes = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise_base=${baseId}&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!imagesRes.ok) return NextResponse.json({ images: [] });

    const imagesData = await imagesRes.json();
    const images: string[] = (imagesData.results ?? [])
      .map((img: { image: string }) => img.image)
      .slice(0, 2);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
