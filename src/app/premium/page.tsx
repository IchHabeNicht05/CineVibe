"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Film, 
  ArrowLeft, 
  Loader2, 
  Lock, 
  Crown, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  Check, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts";

// Slovník pro překlad TMDB žánrů do češtiny
const GENRES_MAP: { [key: number]: string } = {
  28: "Akční",
  12: "Dobrodružný",
  16: "Animovaný",
  35: "Komedie",
  80: "Krimi",
  99: "Dokumentární",
  18: "Drama",
  10751: "Rodinný",
  14: "Fantasy",
  36: "Historický",
  27: "Horor",
  10402: "Hudební",
  9648: "Mysteriózní",
  10749: "Romantický",
  878: "Sci-Fi",
  10770: "TV film",
  53: "Thriller",
  10752: "Válečný",
  37: "Western"
};

interface GenreStat {
  name: string;
  value: number;
}

export default function PremiumDashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Prémiový stav (pro demo účely lze kliknutím aktivovat)
  const [isPremium, setIsPremium] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Statistiky
  const [room, setRoom] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [totalSwiped, setTotalSwiped] = useState<number>(0);
  const [mutualMatches, setMutualMatches] = useState<number>(0);
  const [genreData, setGenreData] = useState<GenreStat[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);

  // Vyřešení hydratace u Recharts v Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Ověření uživatele
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };
    checkUser();
  }, []);

  // 2. Načtení aktivní místnosti z localStorage a stažení statistik
  useEffect(() => {
    if (!user) return;
    const savedRoom = localStorage.getItem("cinevibe_room");
    setRoom(savedRoom);

    if (savedRoom) {
      calculateStats(savedRoom);
    }
  }, [user]);

  // 3. Výpočet statistik na základě dat ze Supabase
  const calculateStats = async (roomCode: string) => {
    setLoadingStats(true);
    
    // Vytáhneme všechny swipy pro danou místnost
    const { data: swipes, error } = await supabase
      .from("movie_swipes")
      .select("*")
      .eq("room_id", roomCode);

    if (error || !swipes) {
      console.error("Chyba při načítání statistik:", error);
      setLoadingStats(false);
      return;
    }

    // Zjistíme unikátní uživatele v místnosti
    const uniqueUsers = Array.from(new Set(swipes.map(s => s.user_name)));
    setUsersCount(uniqueUsers.length);
    setTotalSwiped(swipes.length);

    // Seskupíme swipy podle movie_id
    const movieGroups: { [key: number]: { genres: number[]; swipes: { [user: string]: boolean } } } = {};
    
    swipes.forEach(swipe => {
      if (!movieGroups[swipe.movie_id]) {
        movieGroups[swipe.movie_id] = {
          // Ošetření jsonb pole žánrů
          genres: Array.isArray(swipe.genre_ids) ? swipe.genre_ids : [],
          swipes: {}
        };
      }
      movieGroups[swipe.movie_id].swipes[swipe.user_name] = swipe.is_liked;
    });

    let totalSharedSwipes = 0; // Filmy, které ohodnotili oba partneři
    let sharedLikes = 0;       // Filmy, které se líbily oběma (shody)
    const genreCounter: { [key: string]: number } = {};

    Object.values(movieGroups).forEach(group => {
      const voters = Object.keys(group.swipes);
      
      // Výpočet probíhá pouze u filmů, kde hlasovali alespoň 2 lidé
      if (voters.length >= 2) {
        totalSharedSwipes++;
        
        const isMutualLike = voters.every(user => group.swipes[user] === true);
        if (isMutualLike) {
          sharedLikes++;
          // Spočítáme žánry u úspěšných shod
          group.genres.forEach(genreId => {
            const genreName = GENRES_MAP[genreId];
            if (genreName) {
              genreCounter[genreName] = (genreCounter[genreName] || 0) + 1;
            }
          });
        }
      }
    });

    setMutualMatches(sharedLikes);

    // Výpočet Vibe Score (procento společných shod ku společně ohodnoceným filmům)
    const score = totalSharedSwipes > 0 ? Math.round((sharedLikes / totalSharedSwipes) * 100) : 0;
    setVibeScore(score);

    // Příprava dat pro graf (top 5 žánrů)
    const formattedGenres = Object.entries(genreCounter).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    setGenreData(formattedGenres);
    setLoadingStats(false);
  };

  // Simulace nákupu Premium
  const handleUnlockDemo = () => {
    setUnlocking(true);
    setTimeout(() => {
      setIsPremium(true);
      setUnlocking(false);
    }, 1500);
  };

  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    );
  }

  // Ošetření nepřihlášeného stavu
  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-red-500/20 blur-md" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 shadow-xl">
            <Lock size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Zabezpečená sekce</h2>
        <p className="text-slate-400 mt-2 max-w-sm mb-6">
          Pro zobrazení vašich Premium statistik se musíte nejprve přihlásit.
        </p>
        <Link href="/login">
          <button className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition-all">
            Přihlásit se
          </button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white pb-16">
      {/* VRCHNÍ NAVIGAČNÍ PANEL */}
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Zpět na swipování
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 mt-6">
        
        {/* TITULEK STRÁNKY */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-1.5">
              <Crown size={14} className="fill-amber-500" /> Premium Funkce
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl flex items-center gap-3">
              Vibe Score & Statistiky
            </h1>
          </div>
          
          {room && (
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm self-start md:self-center">
              Místnost: <span className="text-emerald-400 font-mono font-bold uppercase">{room}</span>
            </div>
          )}
        </div>

        {/* --- STAV 1: PREMIUM JEŠTĚ NENÍ AKTIVNÍ (ZÁMEK / PAYWALL) --- */}
        <AnimatePresence mode="wait">
          {!isPremium ? (
            <motion.div 
              key="paywall"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative rounded-3xl border border-amber-500/20 bg-slate-900/40 p-8 md:p-12 backdrop-blur-md shadow-2xl overflow-hidden"
            >
              {/* Světelný efekt na pozadí */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

              <div className="grid md:grid-cols-5 gap-10 items-center relative z-10">
                <div className="md:col-span-3 space-y-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Crown size={24} className="fill-amber-500/10" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Odemkni CineVibe Premium</h2>
                  <p className="text-slate-400 leading-relaxed">
                    Chcete vědět, jak moc se se svou drahou polovičkou filmově shodujete? Aktivujte si Premium balíček a získejte okamžitý přístup k detailní analýze vašeho vkusu.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check size={12} /></div>
                      <span><strong>Vibe Score</strong> - Společný procentuální index shody</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check size={12} /></div>
                      <span><strong>Žánrový radar</strong> - Vizualizace vašich největších průniků</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check size={12} /></div>
                      <span><strong>Rewind funkce</strong> - Možnost vrátit nechtěný swipe zpět</span>
                    </div>
                  </div>
                </div>

                {/* Platební karta */}
                <div className="md:col-span-2 bg-slate-950/80 border border-white/[0.06] rounded-2xl p-6 text-center shadow-xl">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full">Jednorázový nákup</span>
                  <div className="my-6">
                    <span className="text-4xl font-black">79 Kč</span>
                    <span className="text-xs text-slate-500 block mt-1">žádné předplatné, navždy tvoje</span>
                  </div>

                  <button
                    onClick={handleUnlockDemo}
                    disabled={unlocking}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 p-4 font-bold text-slate-950 transition-all duration-300 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] shadow-lg shadow-amber-500/20"
                  >
                    {unlocking ? (
                      <Loader2 size={18} className="animate-spin text-slate-950" />
                    ) : (
                      <>Odemknout Premium (Demo)</>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-3">
                    Kliknutím zdarma otestuješ celé rozhraní a grafy.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            
            // --- STAV 2: PREMIUM JE AKTIVNÍ (ZOBRAZENÍ STATISTIK) ---
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Oznámení o VIP */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Crown className="text-amber-400 fill-amber-400" size={20} />
                  <span className="text-sm font-semibold text-amber-300">Vítej ve VIP zóně, tvůj Premium účet je aktivní!</span>
                </div>
                <button 
                  onClick={() => setIsPremium(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  (Zavřít demo)
                </button>
              </div>

              {/* Rychlá kontrola, zda jsou v místnosti alespoň dva uživatelé */}
              {usersCount < 2 && (
                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-5 flex items-start gap-3 text-sm text-blue-300">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-1">Místnost čeká na partnera</strong>
                    Aktuálně jsi v této místnosti zaznamenán jako jediný aktivní swiper. Vibe Score a žánrový radar se vykreslí v plné kráse, jakmile se tvůj partner připojí pod stejným kódem a odswipuje stejné filmy.
                  </div>
                </div>
              )}

              {/* HLAVNÍ METRIKY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* VIBE SCORE */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Heart size={16} fill={vibeScore > 50 ? "currentColor" : "none"} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vibe Score</span>
                    <h3 className="text-5xl font-black mt-2 text-red-500 tracking-tight">{vibeScore}%</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    {vibeScore >= 80 ? "Naprosté souznění duší! Vyberte jakýkoliv film, nespletete se." :
                     vibeScore >= 50 ? "Skvělý společný základ. Najít film na večer bude hračka!" :
                     vibeScore > 0 ? "Každý máte trochu jiné preference, ale společný průsečík tu je." :
                     "Zatím žádné společné shody. Zkuste odswipovat víc filmů!"}
                  </p>
                </div>

                {/* TOTAL SWIPED */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 flex flex-col justify-between">
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Activity size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Celkem swipů</span>
                    <h3 className="text-5xl font-black mt-2 text-blue-400 tracking-tight">{totalSwiped}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Počet všech reakcí zapsaných v této místnosti. Čím víc filmů projedete, tím přesnější data získáte.
                  </p>
                </div>

                {/* MUTUAL MATCHES */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 flex flex-col justify-between">
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Společné shody</span>
                    <h3 className="text-5xl font-black mt-2 text-emerald-400 tracking-tight">{mutualMatches}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Filmy, na které jste oba nezávisle na sobě řekli srdíčkem „Ano“. Najdete je kompletně v sekci Kolekce.
                  </p>
                </div>

              </div>

              {/* VIZUALIZACE GRAFU */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* GRAF ŽÁNRŮ */}
                <div className="md:col-span-3 rounded-2xl border border-white/[0.08] bg-slate-900/40 p-6 backdrop-blur-xl">
                  <h4 className="text-base font-bold flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-amber-400" />
                    Top 5 společných žánrů
                  </h4>
                  
                  {genreData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={genreData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#94a3b8" 
                            fontSize={12}
                            width={100}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="#f59e0b" 
                            radius={[0, 8, 8, 0]} 
                            barSize={16}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 w-full flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                      <Film size={32} className="mb-2 text-slate-700" />
                      Pro zobrazení žánrového radaru musíte najít alespoň jednu filmovou shodu.
                    </div>
                  )}
                </div>

                {/* DETAIL KOMPATIBILITY */}
                <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold mb-4">Analýza kompatibility</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Z našich dat vyplývá, že vaše filmové chutě se nejvíce potkávají v žánru {genreData[0]?.name ? <strong className="text-amber-400">{genreData[0].name}</strong> : "který teprve odhalujeme"}. 
                    </p>
                    {genreData[1] && (
                      <p className="text-sm text-slate-400 leading-relaxed mt-3">
                        V těsném závěsu se drží <strong className="text-slate-200">{genreData[1].name}</strong>, což ukazuje na pestrou škálu zábavy, kterou si můžete společně užít.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 mt-6">
                    <span className="text-xs text-slate-500 block mb-2">Jak se počítá kompatibilita?</span>
                    <span className="text-xs text-slate-400 leading-normal block">
                      Vibe Score bere v potaz poměr filmů, na které jste oba odpověděli. Čím menší procento neshod (lajk vs. dislajk) u stejných filmů máte, tím vyšší index kompatibility vám systém přidělí.
                    </span>
                  </div>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}