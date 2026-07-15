/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // Načtení watchlistu z localStorage při startu
  useEffect(() => {
    const saved = localStorage.getItem("cinevibe_watchlist");
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // Funkce pro přidání/odebrání z Watchlistu
  const handleToggleWatchlist = (item: any) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      const updated = exists ? prev.filter((w) => w.id !== item.id) : [...prev, item];
      localStorage.setItem("cinevibe_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
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
          <p>Hledám výsledky...</p>
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
          {movies.map((movie: any) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              // Pokud API vrací media_type z multi-search, použije se, jinak spadne na "movie"
              mediaType={movie.media_type || "movie"} 
              isWatchlisted={watchlist.some((w) => w.id === movie.id)}
              onToggleWatchlist={() => handleToggleWatchlist(movie)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 max-w-xl mx-auto mt-12 py-20">
          <p className="text-lg font-semibold text-slate-300">Nebyly nalezeny žádné výsledky</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Zkuste zkontrolovat překlepy nebo zadat jiný název.
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