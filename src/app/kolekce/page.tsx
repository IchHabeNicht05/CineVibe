"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Heart, Film, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface MatchedMovie {
  movie_id: number;
  movie_title: string;
  movie_poster: string;
}

export default function KolekcePage() {
  const [room, setRoom] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchedMovie[]>([]);

  const fetchMatches = async (roomCode: string) => {
    setLoading(true);
    
    // 1. Vytáhneme všechny lajky z této místnosti
    const { data, error } = await supabase
      .from("movie_swipes")
      .select("movie_id, movie_title, movie_poster, user_name")
      .eq("room_id", roomCode.toLowerCase().trim())
      .eq("is_liked", true);

    if (error) {
      console.error("Chyba při načítání shod:", error);
      setLoading(false);
      return;
    }

    // 2. Logika pro nalezení shody: spočítáme, kolikrát se každý movie_id v místnosti objevil
    // Pokud se objevil víckrát než jednou (od různých lidí), je to MATCH!
    const counts: { [key: number]: { title: string; poster: string; users: string[] } } = {};
    
    data?.forEach((swipe) => {
      if (!counts[swipe.movie_id]) {
        counts[swipe.movie_id] = {
          title: swipe.movie_title,
          poster: swipe.movie_poster,
          users: [swipe.user_name]
        };
      } else if (!counts[swipe.movie_id].users.includes(swipe.user_name)) {
        counts[swipe.movie_id].users.push(swipe.user_name);
      }
    });

    // Vyfiltrujeme pouze ty filmy, které mají 2 a více unikátních lajků
    const matchedMovies: MatchedMovie[] = Object.keys(counts)
      .filter((id) => counts[Number(id)].users.length >= 2)
      .map((id) => ({
        movie_id: Number(id),
        movie_title: counts[Number(id)].title,
        movie_poster: counts[Number(id)].poster,
      }));

    setMatches(matchedMovies);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (room.trim()) {
      setIsSubmitted(true);
      fetchMatches(room);
    }
  };

  // Automatické obnovení dat každých 10 vteřin, pokud je uživatel v místnosti
  useEffect(() => {
    if (!isSubmitted || !room) return;
    
    const interval = setInterval(() => {
      fetchMatches(room);
    }, 10000);

    return () => clearInterval(interval);
  }, [isSubmitted, room]);

  // --- OBRAZOVKA 1: Zadání místnosti ---
  if (!isSubmitted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md shadow-2xl"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
              <Heart size={24} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Vaše Kolekce</h1>
            <p className="text-sm text-slate-400 mt-1">
              Zadej kód místnosti pro zobrazení filmů, na kterých jste se shodli.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kód místnosti</label>
              <input
                type="text"
                required
                placeholder="Např. rande123"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-4 font-semibold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-600/10"
            >
              Zobrazit shody <ArrowRight size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- OBRAZOVKA 2: Výpis shod ---
  return (
    <main className="mx-auto max-w-7xl px-6 pt-10 pb-16 text-white min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 sm:text-4xl">
            <Heart size={32} className="text-emerald-500" fill="currentColor" />
            Společné shody
          </h1>
          <p className="mt-1.5 text-slate-400">
            Místnost: <span className="text-emerald-400 font-bold uppercase">{room}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="text-sm font-medium text-slate-400 hover:text-white transition-colors self-start sm:self-center"
        >
          Změnit místnost
        </button>
      </div>

      {loading && matches.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p>Hledám shody v databázi...</p>
        </div>
      ) : matches.length > 0 ? (
        // Mřížka nalezených filmů
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
          {matches.map((movie) => (
            <Link key={movie.movie_id} href={`/film/${movie.movie_id}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-xl transition-transform duration-300 hover:scale-103 group-hover:border-emerald-500/50">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.movie_poster}`}
                  alt={movie.movie_title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-0 p-4 w-full">
                  <h2 className="text-base font-bold line-clamp-2 drop-shadow-md group-hover:text-emerald-400 transition-colors">
                    {movie.movie_title}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // Žádná shoda
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 max-w-xl mx-auto mt-12">
          <Film size={40} className="text-slate-600 mb-3" />
          <h3 className="text-xl font-bold text-slate-300">Zatím žádná shoda</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">
            Běžte s partnerem do sekce Match, zadejte kód <span className="text-emerald-400 font-semibold uppercase">{room}</span> a lajkněte stejné filmy!
          </p>
        </div>
      )}
    </main>
  );
}