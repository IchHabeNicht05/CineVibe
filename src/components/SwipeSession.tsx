"use client";

import { useState } from "react";
import { Movie } from "@/types";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, Film, ArrowRight } from "lucide-react";

interface SwipeSessionProps {
  movies: Movie[];
}

export default function SwipeSession({ movies }: SwipeSessionProps) {
  // Stavy pro přihlášení do místnosti
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  // Stavy pro swipování
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);

  const currentMovie = movies[currentIndex];

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (room.trim() && name.trim()) {
      // PRIDAT TYTO TŘI ŘÁDKY:
      localStorage.setItem("cinevibe_user", name.trim());
      localStorage.setItem("cinevibe_room", room.toLowerCase().trim());
      window.dispatchEvent(new Event("cinevibe_session_changed")); // Rekne Headeru, at se prekresli
      
      setIsJoined(true);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (!currentMovie) return;

    // 1. Zápis našeho rozhodnutí do Supabase
    const { error } = await supabase.from("movie_swipes").insert([
      {
        room_id: room.toLowerCase().trim(),
        user_name: name.trim(),
        movie_id: currentMovie.id,
        movie_title: currentMovie.title,
        movie_poster: currentMovie.poster_path,
        is_liked: liked,
      },
    ]);

    if (error) {
      console.error("Chyba při ukládání swipu:", error);
      return;
    }

    // 2. Pokud jsme dali LIKE, zkontrolujeme, zda ho už nedal partner
    if (liked) {
      const { data: partnerLikes } = await supabase
        .from("movie_swipes")
        .select("*")
        .eq("room_id", room.toLowerCase().trim())
        .eq("movie_id", currentMovie.id)
        .eq("is_liked", true)
        .neq("user_name", name.trim()); // Hledáme lajk od kohokoliv jiného v místnosti

      // Pokud partner tento film už lajknul -> MÁME MATCH!
      if (partnerLikes && partnerLikes.length > 0) {
        setMatchedMovie(currentMovie);
      }
    }

    // Posun na další film v pořadí
    setCurrentIndex((prev) => prev + 1);
  };

  // --- OBRÁZOVKA 1: Vstup do místnosti ---
  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center p-6 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md shadow-2xl"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-3">
              <Film size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Filmový Match</h1>
            <p className="text-sm text-slate-400 mt-1">
              Najdi film, na který se dnes podíváte společně.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tvoje jméno</label>
              <input
                type="text"
                required
                placeholder="Např. Adam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-white placeholder-slate-600 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kód místnosti</label>
              <input
                type="text"
                required
                placeholder="Vymysli kód, např. rande123"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-white placeholder-slate-600 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-4 font-semibold text-white transition-all hover:bg-red-500 shadow-lg shadow-red-600/10"
            >
              Vstoupit do místnosti <ArrowRight size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- OBRAZOVKA 2: Všechno odswipováno ---
  if (currentIndex >= movies.length || !currentMovie) {
    return (
      <div className="flex flex-col items-center justify-center p-6 pt-32 text-center">
        <h2 className="text-2xl font-bold">Filmy ti došly!</h2>
        <p className="text-slate-400 mt-2 max-w-sm">
          Projel jsi celý balíček. Počkej, až tvůj partner dovybere, nebo zkuste založit novou místnost.
        </p>
      </div>
    );
  }

  // --- OBRAZOVKA 3: Zobrazení karet a tlačítek ---
  return (
    <div className="relative flex flex-col items-center justify-center p-6 pt-10 overflow-hidden">
      
      {/* Informace o místnosti nahoře */}
      <div className="mb-6 rounded-full bg-slate-900 border border-slate-800 px-4 py-1.5 text-xs text-slate-400 font-medium">
        Místnost: <span className="text-red-400 font-bold uppercase">{room}</span> | Uživatel: <span className="text-white font-bold">{name}</span>
      </div>

      {/* Krabička pro kartu s animací odchodu do stran */}
      <div className="relative w-full max-w-[340px] aspect-[2/3] sm:max-w-[360px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentMovie.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: 200, opacity: 0, scale: 0.9, rotate: 10 }} // Animace pro přeskočení
            transition={{ duration: 0.3 }}
            className="absolute inset-0 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl select-none"
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`}
              alt={currentMovie.title}
              className="h-full w-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            
            {/* Popisky na kartě */}
            <div className="absolute bottom-0 w-full p-6 text-white">
              <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                ★ {currentMovie.vote_average.toFixed(1)}
              </span>
              <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight drop-shadow-md">
                {currentMovie.title}
              </h2>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Ovládací tlačítka (X a Srdíčko) */}
      <div className="mt-8 flex items-center gap-6 z-10">
        <button
          onClick={() => handleSwipe(false)}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 shadow-xl transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
        >
          <X size={28} />
        </button>
        <button
          onClick={() => handleSwipe(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
        >
          <Heart size={28} fill="currentColor" />
        </button>
      </div>

      {/* --- MODÁLNÍ OKNO: SHODA (MATCH!) --- */}
      <AnimatePresence>
        {matchedMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-4 animate-bounce">
                <Sparkles size={32} fill="currentColor" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-wider text-amber-400 drop-shadow-md">
                Máte Shodu!
              </h2>
              <p className="text-slate-300 mt-2 text-sm">
                Na tohle se dneska večer podíváte! Oběma se vám líbí:
              </p>

              {/* Plakát vítězného filmu */}
              <div className="my-8 w-full max-w-[200px] overflow-hidden rounded-2xl shadow-2xl border-2 border-amber-400">
                <img
                  src={`https://image.tmdb.org/t/p/w500${matchedMovie.poster_path}`}
                  alt={matchedMovie.title}
                  className="w-full object-cover"
                />
              </div>

              <h3 className="text-2xl font-bold text-white mb-8">{matchedMovie.title}</h3>

              <button
                onClick={() => setMatchedMovie(null)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-4 font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Pokračovat ve swipování
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}