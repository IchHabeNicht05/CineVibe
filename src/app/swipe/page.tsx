import SwipeSession from "@/components/SwipeSession";
import { Movie } from "@/types";

async function getSwipeableMovies(): Promise<Movie[]> {
  // Načteme top hodnocené a populární filmy dohromady, ať je z čeho vybírat
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&language=cs-CZ&page=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Chyba při načítání filmů pro swipe");
  const data = await res.json();
  return data.results;
}

export default async function SwipePage() {
  const movies = await getSwipeableMovies();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white">
      <SwipeSession movies={movies} />
    </main>
  );
}