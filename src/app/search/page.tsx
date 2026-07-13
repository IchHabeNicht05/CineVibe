"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import { Movie } from "@/types";
import { Loader2 } from "lucide-react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Voláme naši novou interní API route místo přímého TMDB
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setMovies(data.results || []);
        }
      } catch (err) {
        console.error("Chyba vyhledávání:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div>
      <div className="mb-10 border-b border-slate-900 pb-6">
        <h1 className="text-2xl font-medium text-slate-400">
          Výsledky vyhledávání pro: <span className="text-white font-black text-3xl sm:text-4xl block mt-1">"{query}"</span>
        </h1>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={36} className="animate-spin text-red-500" />
          <p>Hledám filmy...</p>
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 max-w-xl mx-auto mt-12 py-20">
          <p className="text-lg font-semibold text-slate-300">Nebyly nalezeny žádné filmy</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Zkuste zkontrolovat překlepy nebo zadat jiný název filmu.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-10 pb-16 text-white min-h-[calc(100vh-4rem)] bg-slate-950">
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={36} className="animate-spin text-red-500" />
        </div>
      }>
        <SearchResults />
      </Suspense>
    </main>
  );
}