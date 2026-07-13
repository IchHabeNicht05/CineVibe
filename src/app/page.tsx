import MovieCard from "@/components/MovieCard";
import Hero from "@/components/Hero";
import MovieGridWithTabs from "@/components/MovieGridWithTabs";
import { Movie } from "@/types";

async function getPopularMovies(): Promise<Movie[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&language=cs-CZ&page=1`,
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) throw new Error("Chyba při stahování dat");
  
  const data = await res.json();
  return data.results;
}

export default async function Home() {
  const movies = await getPopularMovies();
  
  // Odělíme první film pro Hero sekci a zbytek pro mřížku

  return (
    <main className="min-h-screen bg-slate-950 pb-16">
      {/* Nová velká úvodní sekce */}
      <Hero movies={movies} />

      {/* Tvoje stávající mřížka s ostatními filmy */}
      <MovieGridWithTabs initialMovies={movies} />
    </main>
  );
}