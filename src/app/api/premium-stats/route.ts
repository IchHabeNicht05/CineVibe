import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const GENRES_MAP: { [key: number]: string } = {
  28: "Akční", 12: "Dobrodružný", 16: "Animovaný", 35: "Komedie", 80: "Krimi",
  99: "Dokumentární", 18: "Drama", 10751: "Rodinný", 14: "Fantasy", 36: "Historický",
  27: "Horor", 10402: "Hudební", 9648: "Mysteriózní", 10749: "Romantický",
  878: "Sci-Fi", 10770: "TV film", 53: "Thriller", 10752: "Válečný", 37: "Western"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("room");

  if (!roomId) {
    return NextResponse.json({ error: "Chybí kód místnosti" }, { status: 400 });
  }

  // Podpora pro synchronní (Next.js 14) i asynchronní (Next.js 15+) cookies
  const cookieStore = cookies();
  const resolvedCookies = cookieStore instanceof Promise ? await cookieStore : cookieStore;

  // Vytvoření moderního serverového Supabase klienta pomocí @supabase/ssr
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return resolvedCookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            resolvedCookies.set({ name, value, ...options });
          } catch {
            // Ignorujeme chybu v situacích, kdy nelze cookies modifikovat
          }
        },
        remove(name: string, options: any) {
          try {
            resolvedCookies.delete({ name, ...options });
          } catch {
            // Ignorujeme chybu
          }
        },
      },
    }
  );

  // 1. Ověření přihlášení uživatele (bezpečné getUser() na serveru)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Neautorizovaný přístup" }, { status: 401 });
  }

  // 2. Ověření Premium statusu přímo v DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  if (!profile?.is_premium) {
    return NextResponse.json({ error: "Pro zobrazení statistik je vyžadováno Premium" }, { status: 403 });
  }

  // 3. Načtení dat ze Supabase na serveru
  const { data: swipes, error } = await supabase
    .from("movie_swipes")
    .select("movie_id, user_name, is_liked, genre_ids")
    .eq("room_id", roomId);

  if (error || !swipes) {
    return NextResponse.json({ error: "Chyba při načítání dat" }, { status: 500 });
  }

  // 4. Výpočet statistik
  const uniqueUsers = Array.from(new Set(swipes.map(s => s.user_name)));
  const usersCount = uniqueUsers.length;
  const totalSwiped = swipes.length;

  const movieGroups: { [key: number]: { genres: number[]; swipes: { [user: string]: boolean } } } = {};
  
  swipes.forEach(swipe => {
    if (!movieGroups[swipe.movie_id]) {
      movieGroups[swipe.movie_id] = {
        genres: Array.isArray(swipe.genre_ids) ? swipe.genre_ids : [],
        swipes: {}
      };
    }
    movieGroups[swipe.movie_id].swipes[swipe.user_name] = swipe.is_liked;
  });

  let totalSharedSwipes = 0;
  let sharedLikes = 0;       
  const genreCounter: { [key: string]: number } = {};

  Object.values(movieGroups).forEach(group => {
    const voters = Object.keys(group.swipes);
    
    if (voters.length >= 2) {
      totalSharedSwipes++;
      const isMutualLike = voters.every(user => group.swipes[user] === true);
      if (isMutualLike) {
        sharedLikes++;
        group.genres.forEach(genreId => {
          const genreName = GENRES_MAP[genreId];
          if (genreName) {
            genreCounter[genreName] = (genreCounter[genreName] || 0) + 1;
          }
        });
      }
    }
  });

  const vibeScore = totalSharedSwipes > 0 ? Math.round((sharedLikes / totalSharedSwipes) * 100) : 0;
  const formattedGenres = Object.entries(genreCounter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return NextResponse.json({
    vibeScore,
    totalSwiped,
    mutualMatches: sharedLikes,
    genreData: formattedGenres,
    usersCount
  });
}