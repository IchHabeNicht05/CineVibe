import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genreId = searchParams.get("id");

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing TMDB_API_KEY" }, { status: 500 });
  }

  // Pokud nemáme žánr nebo je to 0 (Vše), vrátíme prázdné pole, frontend použije initialMovie
  if (!genreId || genreId === "0") {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=cs-CZ&sort_by=popularity.desc&with_genres=${genreId}&page=1`,
      { next: { revalidate: 3600 } } // Nakešujeme na hodinu, ať neplýtváme limitem
    );

    if (!res.ok) return NextResponse.json({ results: [] });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chyba žánrového API na serveru:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}