import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie"; // movie nebo tv
  const endpoint = searchParams.get("endpoint") || "discover"; // discover, genres, trending
  const genre = searchParams.get("genre") || "";
  const sort = searchParams.get("sort") || "popularity.desc";
  const page = searchParams.get("page") || "1";

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Chybí TMDB API klíč v .env.local" }, { status: 500 });
  }

  let url = "";

  if (endpoint === "genres") {
    url = `https://api.themoviedb.org/3/genre/${type}/list?api_key=${apiKey}&language=cs-CZ`;
  } else if (endpoint === "trending") {
    url = `https://api.themoviedb.org/3/trending/${type}/week?api_key=${apiKey}&language=cs-CZ&page=${page}`;
  } else {
    // discover - pokročilé vyhledávání s filtry
    url = `https://api.themoviedb.org/3/discover/${type}?api_key=${apiKey}&language=cs-CZ&sort_by=${sort}&page=${page}&include_adult=false`;
    if (genre) {
      url += `&with_genres=${genre}`;
    }
  }

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache na 1 hodinu pro super rychlost
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Nepodařilo se načíst data z TMDB" }, { status: 500 });
  }
}