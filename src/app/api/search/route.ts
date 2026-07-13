import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    console.error("Chybí TMDB_API_KEY v .env.local!");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=cs-CZ&query=${encodeURIComponent(query)}&page=1`
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chyba při volání TMDB API na serveru:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}