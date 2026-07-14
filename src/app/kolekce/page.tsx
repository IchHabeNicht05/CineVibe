"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Heart, Film, ArrowRight, Loader2, Lock, LogOut } from "lucide-react";
import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface MatchedMovie {
  movie_id: number;
  movie_title: string;
  movie_poster: string;
}

export default function KolekcePage() {
  // --- AUTH STAVY ---
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [roomInput, setRoomInput] = useState("");
  const [room, setRoom] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchedMovie[]>([]);
  const [roomError, setRoomError] = useState("");

  // Sledování přihlášení uživatele
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Automatické načtení z localStorage
  useEffect(() => {
    if (user) {
      const savedRoom = localStorage.getItem("cinevibe_room");
      if (savedRoom) {
        setRoom(savedRoom);
        setIsSubmitted(true);
        fetchMatches(savedRoom);
      }
    }
  }, [user]);

  const getUserDisplayName = () => {
    if (!user) return "Anonym";
    return (
      user.user_metadata?.username ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      "Uživatel"
    );
  };

  const fetchMatches = async (roomCode: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("movie_swipes")
      .select("movie_id, movie_title, movie_poster, user_name")
      .eq("room_id", roomCode)
      .eq("is_liked", true);

    if (error) {
      console.error("Chyba při načítání shod:", error);
      setLoading(false);
      return;
    }

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

  // Validovaný vstup na straně Kolekce
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = roomInput.toUpperCase().trim();
    if (formattedCode.length !== 6 || !user) return;

    setLoading(true);
    setRoomError("");

    // Dotaz do Supabase na existenci místnosti
    const { data, error } = await supabase
      .from("rooms")
      .select("code")
      .eq("code", formattedCode)
      .maybeSingle();

    if (error || !data) {
      setRoomError("Tato místnost neexistuje!");
      setLoading(false);
      return;
    }

    setRoom(formattedCode);
    setIsSubmitted(true);
    fetchMatches(formattedCode);
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("cinevibe_room");
    window.dispatchEvent(new Event("cinevibe_session_changed"));
    setRoom("");
    setRoomInput("");
    setIsSubmitted(false);
    setMatches([]);
    setRoomError("");
  };

  useEffect(() => {
    if (!isSubmitted || !room || !user) return;
    
    const interval = setInterval(() => {
      fetchMatches(room);
    }, 10000);

    return () => clearInterval(interval);
  }, [isSubmitted, room, user]);

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-md" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 shadow-xl">
            <Lock size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Přihlášení vyžadováno</h2>
        <p className="text-slate-400 mt-2 max-w-sm mb-6">
          Pro zobrazení vaší společné filmové kolekce se musíte nejprve přihlásit.
        </p>
      </div>
    );
  }

  if (!isSubmitted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 bg-slate-950 text-white">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-emerald-500/10 to-teal-600/10 opacity-50 blur-2xl transition duration-1000" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full rounded-3xl border border-white/[0.08] bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl"
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
                <Heart size={22} fill="currentColor" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Vaše Kolekce</h1>
              <p className="text-sm text-slate-400 mt-2">
                Přihlášen jako: <span className="text-emerald-400 font-semibold">{getUserDisplayName()}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zadej kód místnosti</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Zadej 6místný kód"
                  value={roomInput}
                  onChange={(e) => {
                    setRoomInput(e.target.value.toUpperCase());
                    setRoomError("");
                  }}
                  className={`mt-2 w-full rounded-xl bg-slate-950/80 border p-3.5 text-center text-base font-mono tracking-widest text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none transition-all duration-300 ${
                    roomError ? "border-red-500/50 focus:border-red-500" : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
                {roomError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs font-semibold text-center mt-2"
                  >
                    {roomError}
                  </motion.p>
                )}
              </div>
              <button
                type="submit"
                disabled={roomInput.trim().length !== 6 || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-4 font-semibold text-white transition-all duration-300 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-emerald-600/20"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>Zobrazit shody <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pt-10 pb-16 text-white min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 sm:text-4xl">
            <Heart size={32} className="text-emerald-500" fill="currentColor" />
            Společné shody
          </h1>
          <p className="mt-1.5 text-slate-400">
            Místnost: <span className="text-emerald-400 font-mono font-bold uppercase">{room}</span>
          </p>
        </div>
        <button 
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-red-400 transition-colors self-start sm:self-center border border-slate-800 hover:border-red-500/20 bg-slate-900/50 rounded-xl px-4 py-2"
        >
          <LogOut size={14} />
          Změnit místnost
        </button>
      </div>

      {loading && matches.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p>Hledám shody v databázi...</p>
        </div>
      ) : matches.length > 0 ? (
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
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 max-w-xl mx-auto mt-12">
          <Film size={40} className="text-slate-600 mb-3" />
          <h3 className="text-xl font-bold text-slate-300">Zatím žádná shoda</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">
            Běžte s partnerem do sekce Match, zadejte kód <span className="text-emerald-400 font-mono font-semibold select-all">{room}</span> a lajkněte stejné filmy!
          </p>
        </div>
      )}
    </main>
  );
}