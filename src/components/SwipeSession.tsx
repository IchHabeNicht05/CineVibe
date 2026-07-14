"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/types";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Heart, X, Sparkles, Film, ArrowRight, Lock, Loader2, LogOut, Plus, Copy, Check } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

// --- ROZHRANÍ PRO KARTU ---
interface SwipeCardProps {
  movie: Movie;
  exitX: number;
  onSwipe: (liked: boolean) => void;
}

// --- SAMOSTATNÁ KOMPONENTA KARTY S VLASTNÍ FYZIKOU ---
function SwipeCard({ movie, exitX, onSwipe, ...props }: SwipeCardProps & any) {
  // Každá karta má nyní své izolované Motion Values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  const handleDragEnd = (_event: any, info: any) => {
    const swipeThreshold = 100; // Dráha v pixelech pro detekci swipu
    if (info.offset.x > swipeThreshold) {
      onSwipe(true);
    } else if (info.offset.x < -swipeThreshold) {
      onSwipe(false);
    }
  };

  return (
    <motion.div
      {...props} // Klíčové: Předá interní animační stavy z AnimatePresence (pro plynulý exit)
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }} // Vrací kartu na střed
      dragElastic={0.7}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }} // Rychlé, gumové vrácení zpět bez zasekávání
      onDragEnd={handleDragEnd}
      custom={exitX}
      variants={{
        enter: { scale: 0.95, opacity: 0 },
        center: { scale: 1, opacity: 1 },
        exit: (direction) => ({
          x: direction,
          opacity: 0,
          scale: 0.9,
          rotate: direction > 0 ? 15 : -15,
          transition: { duration: 0.25 }
        })
      }}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900 shadow-2xl cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <img
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        alt={movie.title}
        className="h-full w-full object-cover pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 w-full p-6 text-white pointer-events-none">
        <span className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-md">
          ★ {movie.vote_average.toFixed(1)}
        </span>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight drop-shadow-lg">
          {movie.title}
        </h2>
      </div>
    </motion.div>
  );
}

// --- HLAVNÍ KOMPONENTA RELACE ---
interface SwipeSessionProps {
  movies: Movie[];
}

export default function SwipeSession({ movies }: SwipeSessionProps) {
  // --- AUTH STAVY ---
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Stavy pro místnost
  const [roomInput, setRoomInput] = useState("");
  const [room, setRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Stavy pro validaci a asynchronní akce
  const [roomError, setRoomError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Stavy pro swipování a animace
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);
  
  // Směr odletu karty: kladné číslo = doprava, záporné = doleva
  const [exitX, setExitX] = useState(0);

  const currentMovie = movies[currentIndex];

  // Efekt pro zjištění přihlášeného uživatele
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

  // Načtení aktivní místnosti z localStorage při startu
  useEffect(() => {
    if (user) {
      const savedRoom = localStorage.getItem("cinevibe_room");
      if (savedRoom) {
        setRoom(savedRoom);
        setIsJoined(true);
      }
    }
  }, [user]);

  // Generátor kódu
  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Vytvoření místnosti se zápisem do databáze
  const handleCreateRoom = async () => {
    if (!user) return;
    setActionLoading(true);
    setRoomError("");

    let attempts = 0;
    let newCode = "";
    let success = false;

    while (attempts < 5 && !success) {
      newCode = generateRoomCode();
      const { error } = await supabase.from("rooms").insert([
        { code: newCode, created_by: user.id }
      ]);

      if (!error) {
        success = true;
      } else {
        attempts++;
      }
    }

    if (success) {
      localStorage.setItem("cinevibe_room", newCode);
      window.dispatchEvent(new Event("cinevibe_session_changed")); 
      setRoom(newCode);
      setIsJoined(true);
    } else {
      setRoomError("Nepodařilo se vygenerovat místnost. Zkus to znovu.");
    }
    setActionLoading(false);
  };

  // Připojení se do existující místnosti s VALIDACÍ
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = roomInput.toUpperCase().trim();
    if (formattedCode.length !== 6 || !user) return;

    setActionLoading(true);
    setRoomError("");

    const { data, error } = await supabase
      .from("rooms")
      .select("code")
      .eq("code", formattedCode)
      .maybeSingle();

    if (error || !data) {
      setRoomError("Tato místnost neexistuje! Zkontroluj kód od partnera.");
      setActionLoading(false);
      return;
    }

    localStorage.setItem("cinevibe_room", formattedCode);
    window.dispatchEvent(new Event("cinevibe_session_changed")); 
    setRoom(formattedCode);
    setIsJoined(true);
    setActionLoading(false);
  };

  const handleLeave = () => {
    localStorage.removeItem("cinevibe_room");
    window.dispatchEvent(new Event("cinevibe_session_changed"));
    setRoom("");
    setRoomInput("");
    setIsJoined(false);
    setCurrentIndex(0);
    setMatchedMovie(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Zápis swipu a kontrolu shody
  const handleSwipe = async (liked: boolean) => {
    if (!currentMovie || !user) return;

    const userName = getUserDisplayName();

    const { error } = await supabase.from("movie_swipes").insert([
      {
        room_id: room,
        user_name: userName,
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

    if (liked) {
      const { data: partnerLikes } = await supabase
        .from("movie_swipes")
        .select("*")
        .eq("room_id", room)
        .eq("movie_id", currentMovie.id)
        .eq("is_liked", true)
        .neq("user_name", userName);

      if (partnerLikes && partnerLikes.length > 0) {
        setMatchedMovie(currentMovie);
      }
    }

    setCurrentIndex((prev) => prev + 1);
  };

  // Sjednocená funkce pro nastavení směru animace odletu a provede swipe
  const performSwipe = (liked: boolean) => {
    setExitX(liked ? 350 : -350);
    handleSwipe(liked);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-red-500/20 blur-md" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 shadow-xl">
            <Lock size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Přihlášení vyžadováno</h2>
        <p className="text-slate-400 mt-2 max-w-sm mb-6">
          Pro swipování filmů a vytváření sdílených místností s přáteli se musíte nejprve přihlásit.
        </p>
      </div>
    );
  }

  // --- OBRAZOVKA 1: Výběr místnosti ---
  if (!isJoined) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 bg-slate-950 text-white">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-red-500/10 to-rose-600/10 opacity-50 blur-2xl transition duration-1000" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full rounded-3xl border border-white/[0.08] bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl"
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
                <Film size={22} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Filmový Match</h1>
              <p className="text-sm text-slate-400 mt-2">
                Přihlášen jako: <span className="text-red-400 font-semibold">{getUserDisplayName()}</span>
              </p>
            </div>

            <div className="space-y-6">
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCreateRoom}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-4 font-semibold text-white transition-all duration-300 hover:bg-red-500 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-600/20"
              >
                {actionLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )} 
                Vytvořit novou místnost
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Nebo se připoj k partnerovi</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    disabled={actionLoading}
                    placeholder="Zadej 6místný kód partnera"
                    value={roomInput}
                    onChange={(e) => {
                      setRoomInput(e.target.value.toUpperCase());
                      setRoomError("");
                    }}
                    className={`w-full rounded-xl bg-slate-950/80 border p-3.5 text-center text-base font-mono tracking-widest text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500/15 focus:outline-none transition-all duration-300 ${
                      roomError ? "border-red-500/50 focus:border-red-500" : "border-slate-800 focus:border-red-500"
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
                  disabled={roomInput.trim().length !== 6 || actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-4 font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {actionLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>Připojit se <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- OBRAZOVKA 2: Všechno odswipováno ---
  if (currentIndex >= movies.length || !currentMovie) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-red-500/10 blur-md" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 shadow-xl">
            <Film size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Filmy ti došly!</h2>
        <p className="text-slate-400 mt-2 max-w-sm mb-8">
          Projel jsi celý balíček. Počkej, až tvůj partner dovybere, nebo zkuste založit novou místnost.
        </p>
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800/80 px-6 py-3.5 font-semibold text-slate-300 transition-all duration-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 active:scale-[0.98]"
        >
          <LogOut size={16} />
          Odejít z místnosti
        </button>
      </div>
    );
  }

  // --- OBRAZOVKA 3: Swipování karet ---
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-6 bg-slate-950 text-white overflow-hidden">
      
      {/* Horní info bar */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl sm:rounded-full bg-slate-900/80 border border-slate-800/60 pl-5 pr-2.5 py-2 sm:py-1.5 text-xs text-slate-400 font-medium backdrop-blur-md max-w-full">
        <span className="tracking-wide">
          Místnost: <span className="text-white font-mono font-extrabold text-sm select-all">{room}</span>
        </span>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-1 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 transition-all duration-200"
            title="Kopírovat kód místnosti"
          >
            {copied ? (
              <>
                <Check size={11} className="text-emerald-500" />
                <span className="text-emerald-500 text-[10px]">Zkopírováno!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span className="text-[10px]">Kopírovat</span>
              </>
            )}
          </button>

          <button 
            onClick={handleLeave}
            className="flex items-center gap-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1 transition-all duration-200 hover:text-red-300"
          >
            <LogOut size={11} />
            <span>Odejít</span>
          </button>
        </div>
      </div>

      {/* Kontejner s kartami */}
      <div className="relative w-full max-w-[340px] aspect-[2/3] sm:max-w-[360px]">
        <AnimatePresence custom={exitX} mode="popLayout">
          {/* Volání izolované komponenty SwipeCard */}
          <SwipeCard
            key={currentMovie.id}
            movie={currentMovie}
            exitX={exitX}
            onSwipe={performSwipe}
          />
        </AnimatePresence>
      </div>

      {/* Ovládací tlačítka dole */}
      <div className="mt-8 flex items-center gap-6 z-10">
        <button
          onClick={() => performSwipe(false)}
          aria-label="Nelíbí se mi"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/80 text-slate-400 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 active:scale-90"
        >
          <X size={28} />
        </button>
        <button
          onClick={() => performSwipe(true)}
          aria-label="Líbí se mi"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 transition-all duration-300 hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-90"
        >
          <Heart size={28} fill="currentColor" />
        </button>
      </div>

      {/* Modální okno při Shodě */}
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-4 animate-bounce border border-amber-500/20">
                <Sparkles size={32} fill="currentColor" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-wider text-amber-400 drop-shadow-md">
                Máte Shodu!
              </h2>
              <p className="text-slate-300 mt-2 text-sm">
                Na tohle se dneska večer podíváte! Oběma se vám líbí:
              </p>

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
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 font-semibold text-white transition-colors hover:bg-slate-800"
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