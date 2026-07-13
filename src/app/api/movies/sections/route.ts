// src/app/api/movies/sections/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "popular";
  const media = searchParams.get("media") || "movie";
  const page = searchParams.get("page") || "1";
  const region = searchParams.get("region") || "CZ";
  
  // 1. NOVÝ PARAMETR PRO ŽÁNRY
  const genre = searchParams.get("genre") || "";

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chybí TMDB API klíč" }, { status: 500 });
  }

  const providerIds: Record<string, number> = {
    netflix: 8,
    hbo: 1899,
    disney: 337,
    skyshowtime: 1773,
    prime: 119,
    apple: 350,
  };

  try {
    let url = "";

    // A. KOMBINOVANÉ FILTROVÁNÍ (Služba + Žánr)
    if (providerIds[type]) {
      const providerId = providerIds[type];
      url = `https://api.themoviedb.org/3/discover/${media}?api_key=${apiKey}&language=cs-CZ&sort_by=popularity.desc&watch_region=${region}&with_watch_providers=${providerId}&page=${page}`;
      if (genre) {
        url += `&with_genres=${genre}`;
      }
    } 
    // B. DYNAMICKÝ ŽÁNROVÝ FILTR PRO TRENDY / NOVINKY / NEJLEPŠÍ
    else if (genre) {
      let sortByParam = "popularity.desc";
      let extraParams = "";
      
      if (type === "top_rated") {
        sortByParam = "vote_average.desc";
        extraParams = "&vote_count.gte=150"; // Odfiltrujeme neznámé věci s pár hlasy
      } else if (type === "now_playing") {
        // Pro novinky s žánrem simulujeme časové okno vydání
        const today = new Date().toISOString().split("T")[0];
        const halfYearAgo = new Date();
        halfYearAgo.setMonth(halfYearAgo.getMonth() - 6);
        const pastDate = halfYearAgo.toISOString().split("T")[0];
        
        if (media === "movie") {
          extraParams = `&release_date.gte=${pastDate}&release_date.lte=${today}`;
        } else {
          extraParams = `&first_air_date.gte=${pastDate}&first_air_date.lte=${today}`;
        }
      }
      
      url = `https://api.themoviedb.org/3/discover/${media}?api_key=${apiKey}&language=cs-CZ&sort_by=${sortByParam}&region=${region}&watch_region=${region}&page=${page}&with_genres=${genre}${extraParams}`;
    } 
    // C. KLASICKÝ BEZŽÁNROVÝ DOTAZ
    else {
      let tmdbEndpoint = type;
      if (media === "tv" && type === "now_playing") {
        tmdbEndpoint = "on_the_air";
      }
      url = `https://api.themoviedb.org/3/${media}/${tmdbEndpoint}?api_key=${apiKey}&language=cs-CZ&region=${region}&page=${page}`;
    }

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: `Chyba TMDB: ${res.status}` }, { status: res.status });

    const data = await res.json();
    return NextResponse.json(data.results || []);
  } catch (error) {
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}