// app/swipe/page.tsx
import SwipeSession from "@/components/SwipeSession";
import { Movie } from "@/types";

// Pomocná funkce pro náhodné promíchání pole (Fisher-Yates shuffle)
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function getSwipeableContent(): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY;
  const lang = "cs-CZ";

  // Načteme Mix nejlepších/populárních filmů A seriálů naráz
  const [resMoviesTop, resMoviesPop, resTvTop, resTvPop] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=${lang}&page=1`, { next: { revalidate: 3600 } }),
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${lang}&page=1`, { next: { revalidate: 3600 } }),
    fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&language=${lang}&page=1`, { next: { revalidate: 3600 } }),
    fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=${lang}&page=1`, { next: { revalidate: 3600 } }),
  ]);

  const [moviesTop, moviesPop, tvTop, tvPop] = await Promise.all([
    resMoviesTop.ok ? resMoviesTop.json().then(d => d.results) : Promise.resolve([]),
    resMoviesPop.ok ? resMoviesPop.json().then(d => d.results) : Promise.resolve([]),
    resTvTop.ok ? resTvTop.json().then(d => d.results) : Promise.resolve([]),
    resTvPop.ok ? resTvPop.json().then(d => d.results) : Promise.resolve([]),
  ]);

  // Mapování filmů
  const formattedMovies = [...moviesTop, ...moviesPop].map((m: any) => ({
    id: m.id,
    title: m.title,
    poster_path: m.poster_path,
    vote_average: m.vote_average,
    genre_ids: m.genre_ids,
  }));

  // Mapování seriálů (Sjednocení klíče 'name' -> 'title')
  const formattedTv = [...tvTop, ...tvPop].map((t: any) => ({
    id: t.id,
    title: t.name, // TMDB u seriálů používá .name, přemapujeme na .title pro tvůj frontend
    poster_path: t.poster_path,
    vote_average: t.vote_average,
    genre_ids: t.genre_ids,
  }));

  // Spojíme dohromady a odstraníme duplicity (pokud by byl nějaký titul v Top i Popular zároveň)
  const allContent = [...formattedMovies, ...formattedTv];
  const uniqueContent = Array.from(new Map(allContent.map(item => [item.id, item])).values());

  // Vrátíme perfektně promíchaný mix filmů a seriálů
  return shuffleArray(uniqueContent);
}

export default async function SwipePage() {
  const content = await getSwipeableContent();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white">
      <SwipeSession movies={content} />
    </main>
  );
}