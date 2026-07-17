"use client";

import { useState, useEffect, Suspense } from "react";
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
  Check, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";

interface GenreStat {
  name: string;
  value: number;
}

function PremiumDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [isPremium, setIsPremium] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);  
  const isSuccess = searchParams.get("success") === "true";

  // Statistiky
  const [room, setRoom] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [totalSwiped, setTotalSwiped] = useState<number>(0);
  const [mutualMatches, setMutualMatches] = useState<number>(0);
  const [genreData, setGenreData] = useState<GenreStat[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detekce úspěšné platby
  useEffect(() => {
    if (isSuccess) {
      setShowSuccessToast(true);
      setIsPremium(true); 
      
      const cleanUrl = window.location.pathname; 
      window.history.replaceState(null, "", cleanUrl);

      const timer = setTimeout(() => setShowSuccessToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  // Ověření uživatele a jeho premium statusu
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          setIsPremium(profile.is_premium);
        }
      } else {
        setUser(null);
        setIsPremium(false);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Načtení dat z našeho nového bezpečného API
  useEffect(() => {
    if (!user || !isPremium) return;
    const savedRoom = localStorage.getItem("cinevibe_room");
    setRoom(savedRoom);

    if (savedRoom) {
      fetchStats(savedRoom);
    }
  }, [user, isPremium]);

  const fetchStats = async (roomCode: string) => {
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/premium-stats?room=${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setVibeScore(data.vibeScore);
        setTotalSwiped(data.totalSwiped);
        setMutualMatches(data.mutualMatches);
        setGenreData(data.genreData);
        setUsersCount(data.usersCount);
      } else {
        console.error("Nepodařilo se načíst statistiky ze serveru.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setUnlocking(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Nepodařilo se vygenerovat platební bránu.");
        setUnlocking(false);
      }
    } catch (error) {
      console.error(error);
      setUnlocking(false);
    }
  };

  if (authLoading || !mounted) {
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
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white pb-16 relative overflow-hidden">
      
      {/* Dekorativní záře na pozadí celého webu */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 p-4 text-emerald-200 shadow-2xl backdrop-blur-md">
              <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-bold">Platba byla úspěšná!</h4>
                <p className="text-xs text-emerald-300/80">Vítej v CineVibe Premium. Tvůj účet byl povýšen.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-6 pt-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Zpět na swipování
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 mt-6 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-1.5">
              <Crown size={14} className="fill-amber-500 animate-pulse" /> Premium Funkce
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl flex items-center gap-3 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Vibe Score & Statistiky
            </h1>
          </div>
          
          {room && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl text-sm self-start md:self-center">
              Místnost: <span className="text-emerald-400 font-mono font-bold uppercase">{room}</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isPremium ? (
            <motion.div 
              key="paywall"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative rounded-3xl border border-amber-500/20 bg-slate-900/30 p-8 md:p-12 backdrop-blur-md shadow-2xl overflow-hidden"
            >
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

                <div className="md:col-span-2 bg-slate-950/80 border border-white/[0.06] rounded-2xl p-6 text-center shadow-xl flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full">Jednorázový nákup</span>
                  <div className="my-6">
                    <span className="text-4xl font-black">79 Kč</span>
                    <span className="text-xs text-slate-500 block mt-1">žádné předplatné, navždy tvoje</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={unlocking}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 p-4 font-bold text-slate-950 transition-all duration-300 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] shadow-lg shadow-amber-500/20"
                  >
                    {unlocking ? (
                      <Loader2 size={18} className="animate-spin text-slate-950" />
                    ) : (
                      <>Odemknout Premium</>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setIsPremium(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-400 mt-4 underline transition-all"
                  >
                    Chci jen otestovat vzhled (Demo bez placení)
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* VIP banner se zlatavým gradientem */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 p-4 flex items-center justify-between gap-4 shadow-lg shadow-amber-500/5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Crown className="text-amber-400 fill-amber-400 animate-bounce" size={20} />
                  <span className="text-sm font-semibold text-amber-300">Vítej ve VIP zóně, tvůj Premium účet je aktivní!</span>
                </div>
                <button 
                  onClick={() => setIsPremium(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  (Zavřít demo)
                </button>
              </div>

              {usersCount < 2 && !loadingStats && (
                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-5 flex items-start gap-3 text-sm text-blue-300">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-1">Místnost čeká na partnera</strong>
                    Aktuálně jsi v této místnosti zaznamenán jako jediný aktivní swiper. Vibe Score a žánrový radar se vykreslí v plné kráse, jakmile se tvůj partner připojí pod stejným kódem a odswipuje stejné filmy.
                  </div>
                </div>
              )}

              {/* HLAVNÍ METRIKY S LOADING STAVEM (SKELETONY) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* VIBE SCORE */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-md p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:border-red-500/20 transition-all duration-300">
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Heart size={16} fill={vibeScore > 50 ? "currentColor" : "none"} />
                  </div>
                  {loadingStats ? (
                    <div className="space-y-3">
                      <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                      <div className="h-12 w-24 bg-slate-800 rounded animate-pulse" />
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vibe Score</span>
                      <h3 className="text-5xl font-black mt-2 text-red-500 tracking-tight">
                        {vibeScore}%
                      </h3>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    {loadingStats ? "Načítám analýzu shody..." : 
                     vibeScore >= 80 ? "Naprosté souznění duší! Vyberte jakýkoliv film, nespletete se." :
                     vibeScore >= 50 ? "Skvělý společný základ. Najít film na večer bude hračka!" :
                     vibeScore > 0 ? "Každý máte trochu jiné preference, ale společný průsečík tu je." :
                     "Zatím žádné společné shody. Zkuste odswipovat víc filmů!"}
                  </p>
                </div>

                {/* TOTAL SWIPED */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-lg hover:border-blue-500/20 transition-all duration-300">
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Film size={16} />
                  </div>
                  {loadingStats ? (
                    <div className="space-y-3">
                      <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                      <div className="h-12 w-24 bg-slate-800 rounded animate-pulse" />
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Celkem swipů</span>
                      <h3 className="text-5xl font-black mt-2 text-blue-400 tracking-tight">{totalSwiped}</h3>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Počet všech reakcí zapsaných v této místnosti. Čím víc filmů projedete, tím přesnější data získáte.
                  </p>
                </div>

                {/* MUTUAL MATCHES */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-lg hover:border-emerald-500/20 transition-all duration-300">
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles size={16} />
                  </div>
                  {loadingStats ? (
                    <div className="space-y-3">
                      <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                      <div className="h-12 w-24 bg-slate-800 rounded animate-pulse" />
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Společné shody</span>
                      <h3 className="text-5xl font-black mt-2 text-emerald-400 tracking-tight">{mutualMatches}</h3>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Filmy, na které jste oba nezávisle na sobě řekli srdíčkem „Ano“. Najdete je kompletně v sekci Kolekce.
                  </p>
                </div>

              </div>

              {/* VIZUALIZACE GRAFU A DETAILŮ */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* GRAF ŽÁNRŮ */}
                <div className="md:col-span-3 rounded-2xl border border-white/[0.08] bg-slate-900/30 p-6 backdrop-blur-xl shadow-lg">
                  <h4 className="text-base font-bold flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-amber-400" />
                    Top 5 společných žánrů
                  </h4>
                  
                  {loadingStats ? (
                    <div className="h-64 w-full flex flex-col gap-4 justify-center">
                      <div className="h-4 bg-slate-800/80 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-slate-800/80 rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-slate-800/80 rounded animate-pulse w-5/6" />
                      <div className="h-4 bg-slate-800/80 rounded animate-pulse w-2/3" />
                    </div>
                  ) : genreData.length > 0 ? (
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
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="url(#goldGradient)" 
                            radius={[0, 8, 8, 0]} 
                            barSize={16}
                          >
                            <defs>
                              <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#fbbf24" />
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 w-full flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                      <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center mb-3">
                        <Film size={20} className="text-slate-600" />
                      </div>
                      <p className="font-semibold text-slate-400">Zatím žádné žánrové shody</p>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs">Pro zobrazení žánrového radaru musíte se svým partnerem najít alespoň jeden společný film.</p>
                    </div>
                  )}
                </div>

                {/* DETAIL KOMPATIBILITY */}
                <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-slate-900/30 p-6 backdrop-blur-xl flex flex-col justify-between shadow-lg">
                  {loadingStats ? (
                    <div className="space-y-4">
                      <div className="h-6 bg-slate-800 rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-base font-bold mb-4">Analýza kompatibility</h4>
                      {genreData.length > 0 ? (
                        <>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            Z našich dat vyplývá, že vaše filmové chutě se nejvíce potkávají v žánru <strong className="text-amber-400">{genreData[0]?.name}</strong>. 
                          </p>
                          {genreData[1] && (
                            <p className="text-sm text-slate-400 leading-relaxed mt-3">
                              V těsném závěsu se drží <strong className="text-slate-200">{genreData[1].name}</strong>, což ukazuje na pestrou škálu zábavy, kterou si můžete společně užít.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Jakmile najdete první shody, na tomto místě se zobrazí hloubková analýza vaší vzájemné kompatibility.
                        </p>
                      )}
                    </div>
                  )}

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

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    }>
      <PremiumDashboard />
    </Suspense>
  );
}