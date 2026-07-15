/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Používáme search/multi pro vyhledávání filmů i seriálů najednou
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&language=cs-CZ&query=${encodeURIComponent(query)}&page=1`
    );
    
    if (!res.ok) throw new Error("Chyba TMDB");
    
    const data = await res.json();
    
    // Vyfiltrujeme osoby (herce), chceme v našeptávači jen filmy a seriály
    const filteredResults = data.results?.filter(
      (item: any) => item.media_type === "movie" || item.media_type === "tv"
    ) || [];

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    return NextResponse.json({ error: "Chyba při vyhledávání" }, { status: 500 });
  }
}