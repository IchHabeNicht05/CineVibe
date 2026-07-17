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
  AlertCircle,
  Users
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

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
  if (!user || !isPremium) return;

  const getRoomAndStats = async () => {
    // 1. Zkusíme nejdřív localStorage
    let currentRoom = localStorage.getItem("cinevibe_room");

    // 2. Když v localStorage není (protože uživatel odešel), vytáhneme ji z DB profilu
    if (!currentRoom) {
      setLoadingStats(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_room_id")
        .eq("id", user.id)
        .single();

      if (profile?.last_room_id) {
        currentRoom = profile.last_room_id;
        // Volitelně ji vrátíme do localStorage, aby se příště nenačítala z DB
        localStorage.setItem("cinevibe_room", profile.last_room_id);
      }
    }

    // 3. Pokud jsme místnost našli (z jakéhokoliv zdroje), načteme statistiky
    if (currentRoom) {
      setRoom(currentRoom);
      fetchStats(currentRoom);
    } else {
      setLoadingStats(false);
    }
  };

  getRoomAndStats();
}, [user, isPremium]);

  const fetchStats = async (roomCode: string) => {
  setLoadingStats(true);
  try {
    // 1. Vytáhneme si aktuální session přímo ze Supabase na klientovi
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 2. Pošleme požadavek i s tokenem v hlavičce
    const response = await fetch(`/api/premium-stats?room=${roomCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
    });

    if (response.ok) {
      const data = await response.json();
      setVibeScore(data.vibeScore);
      setTotalSwiped(data.totalSwiped);
      setMutualMatches(data.mutualMatches);
      setGenreData(data.genreData);
      setUsersCount(data.usersCount);
    } else {
      console.error("API vrátilo chybu:", response.status, response.statusText);
    }
  } catch (err) {
    console.error("Chyba při komunikaci s API:", err);
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#05070c]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center bg-[#05070c] text-white">
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-full bg-red-500/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 shadow-2xl">
            <Lock size={26} />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Zabezpečená sekce</h2>
        <p className="text-slate-400 mt-2 max-w-sm mb-6 text-sm">
          Pro zobrazení vašich Premium statistik se musíte nejprve přihlásit.
        </p>
        <Link href="/login">
          <button className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/15">
            Přihlásit se
          </button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#05070c] text-slate-100 pb-20 relative overflow-hidden selection:bg-red-500/30">
      
      {/* Ambientní záře na pozadí pro hloubku scény */}
      <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-red-500/[0.03] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-1/4 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors group">
          <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" /> Zpět na swipování
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6 relative z-10">
        
        {/* Modernizovaný Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-900/60">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3">
              <Crown size={11} className="fill-amber-400/20" /> Premium VIP
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Vibe Score & Statistiky
            </h1>
          </div>
          
          {room && (
            <div className="inline-flex items-center gap-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 px-3 py-1.5 rounded-xl text-xs text-slate-400 shadow-sm">
              <Users size={13} className="text-slate-500" />
              Místnost: <span className="text-emerald-400 font-mono font-bold uppercase tracking-wide">{room}</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isPremium ? (
            /* PAYWALL (Zůstává beze změny logiky, upraven pouze vizuál) */
            <motion.div 
              key="paywall"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="relative rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950/70 p-8 md:p-12 backdrop-blur-md shadow-2xl overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/[0.03] blur-3xl pointer-events-none" />
              <div className="grid md:grid-cols-5 gap-8 items-center relative z-10">
                <div className="md:col-span-3 space-y-5">
                  <h2 className="text-2xl font-bold tracking-tight">Odemkni CineVibe Premium</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Chcete vědět, jak moc se se svou drahou polovičkou filmově shodujete? Aktivujte si Premium balíček a získejte okamžitý přístup k detailní analýze vašeho vkusu.
                  </p>
                  <div className="space-y-2.5 pt-1">
                    {[
                      { t: "Vibe Score", d: "Společný procentuální index shody" },
                      { t: "Žánrový radar", d: "Vizualizace vašich největších průniků" },
                      { t: "Rewind funkce", d: "Možnost vrátit nechtěný swipe zpět" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs text-slate-300">
                        <div className="flex h-4 w-4 mt-0.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Check size={10} /></div>
                        <span><strong>{item.t}</strong> – {item.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 bg-[#090d16] border border-slate-800/80 rounded-2xl p-6 text-center shadow-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded-full">Jednorázový nákup</span>
                  <div className="my-5">
                    <span className="text-3xl font-black">79 Kč</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">žádné předplatné, navždy tvoje</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={unlocking}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-3 text-xs font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.99] shadow-lg shadow-amber-500/10"
                  >
                    {unlocking ? <Loader2 size={14} className="animate-spin" /> : "Odemknout Premium"}
                  </button>
                  <button onClick={() => setIsPremium(true)} className="text-[10px] text-slate-500 hover:text-slate-400 mt-3 underline transition-all">
                    Vstoupit do Demo režimu
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            
            /* DASHBOARD ZÓNA */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Vymazlený VIP status banner */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500/[0.06] via-slate-900/40 to-slate-900/10 border border-amber-500/15 p-3.5 flex items-center justify-between gap-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Crown size={14} className="fill-amber-400/10" />
                  </div>
                  <span className="text-xs font-medium text-amber-300/90">Premium modul aktivován. Užijte si hloubkovou analýzu.</span>
                </div>
                <button onClick={() => setIsPremium(false)} className="text-[10px] text-slate-500 hover:text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-900 transition-colors">
                  Zavřít demo
                </button>
              </div>

              {/* Stylovější info box */}
              {usersCount < 2 && !loadingStats && (
                <div className="rounded-xl bg-sky-500/[0.02] border border-sky-500/10 p-4 flex items-start gap-3 text-xs text-sky-300/90 shadow-sm backdrop-blur-sm">
                  <div className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/10">
                    <AlertCircle size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-sky-200 block font-semibold">Čeká se na připojení partnera</strong>
                    <p className="text-slate-400 leading-relaxed">Aktuálně jsi v místnosti sám. Jakmile se tvůj partner připojí pod stejným kódem a začne swipovat, okamžitě zde uvidíš reálné přepočty a žánrové průniky.</p>
                  </div>
                </div>
              )}

              {/* HLAVNÍ METRIKY (Bento Grid Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. VIBE SCORE CARD */}
                <div className="group relative rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-5 flex flex-col justify-between overflow-hidden shadow-xl hover:border-slate-700/60 transition-all duration-300">
                  {/* Jemné vnitřní podsvícení při hoveru */}
                  <div className="absolute -inset-px bg-gradient-to-b from-red-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vibe Score</span>
                    <div className="h-7 w-7 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                      <Heart size={13} fill={vibeScore > 0 ? "currentColor" : "none"} />
                    </div>
                  </div>
                  
                  <div className="my-4 relative z-10">
                    {loadingStats ? (
                      <div className="h-10 w-20 bg-slate-800/50 rounded-lg animate-pulse" />
                    ) : (
                      <h3 className="text-4xl font-black tracking-tight bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                        {vibeScore}%
                      </h3>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-slate-400/90 leading-relaxed relative z-10 border-t border-slate-900/60 pt-3">
                    {vibeScore >= 80 ? "Naprosté souznění duší! Vyberte cokoliv." :
                     vibeScore >= 50 ? "Skvělý společný základ na filmový večer." :
                     vibeScore > 0 ? "Máte odlišný vkus, ale průsečík se najde!" :
                     "Zatím čistý stůl. Společná shoda se teprve ukáže."}
                  </p>
                </div>

                {/* 2. TOTAL SWIPED CARD */}
                <div className="group relative rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-5 flex flex-col justify-between overflow-hidden shadow-xl hover:border-slate-700/60 transition-all duration-300">
                  <div className="absolute -inset-px bg-gradient-to-b from-blue-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Celkem swipů</span>
                    <div className="h-7 w-7 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
                      <Film size={13} />
                    </div>
                  </div>
                  
                  <div className="my-4 relative z-10">
                    {loadingStats ? (
                      <div className="h-10 w-20 bg-slate-800/50 rounded-lg animate-pulse" />
                    ) : (
                      <h3 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {totalSwiped}
                      </h3>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-slate-400/90 leading-relaxed relative z-10 border-t border-slate-900/60 pt-3">
                    Počet zaznamenaných reakcí. Více hodnocení znamená přesnější výsledky žánrového radaru.
                  </p>
                </div>

                {/* 3. MUTUAL MATCHES CARD */}
                <div className="group relative rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-5 flex flex-col justify-between overflow-hidden shadow-xl hover:border-slate-700/60 transition-all duration-300">
                  <div className="absolute -inset-px bg-gradient-to-b from-emerald-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Společné shody</span>
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
                      <Sparkles size={13} />
                    </div>
                  </div>
                  
                  <div className="my-4 relative z-10">
                    {loadingStats ? (
                      <div className="h-10 w-20 bg-slate-800/50 rounded-lg animate-pulse" />
                    ) : (
                      <h3 className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        {mutualMatches}
                      </h3>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-slate-400/90 leading-relaxed relative z-10 border-t border-slate-900/60 pt-3">
                    Filmy, které se líbily vám oběma. Kompletní seznam najdete okamžitě v záložce Kolekce.
                  </p>
                </div>

              </div>

              {/* SEKCE DETALŮ A GRAFU */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                
                {/* GRAF ŽÁNRŮ */}
                <div className="md:col-span-3 rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900/30 to-slate-950/60 p-5 backdrop-blur-md shadow-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                    <TrendingUp size={14} className="text-amber-400" />
                    Top 5 společných žánrů
                  </h4>
                  
                  {loadingStats ? (
                    <div className="h-56 w-full flex flex-col gap-3.5 justify-center">
                      <div className="h-3 bg-slate-900 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-900 rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-slate-900 rounded animate-pulse w-5/6" />
                    </div>
                  ) : genreData.length > 0 ? (
                    <div className="h-56 w-full -ml-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={genreData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#64748b" 
                            fontSize={11}
                            width={100}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.015)' }}
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '10px', fontSize: '12px' }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="url(#premiumGold)" 
                            radius={[0, 4, 4, 0]} 
                            barSize={12}
                          >
                            <defs>
                              <linearGradient id="premiumGold" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#d97706" />
                                <stop offset="100%" stopColor="#fbbf24" />
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    /* Krásný prázdný stav pro graf */
                    <div className="h-56 w-full flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center mb-3 shadow-inner">
                        <Film size={16} className="text-slate-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400">Žánrová data nejsou připravena</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">Jakmile s partnerem označíte shodný film, algoritmus rozebere jeho tagy a vykreslí žánrovou mapu.</p>
                    </div>
                  )}
                </div>

                {/* ANALÝZA KOMPATIBILITY */}
                <div className="md:col-span-2 rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900/30 to-slate-950/60 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
                  {loadingStats ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-900 rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-slate-900 rounded animate-pulse w-full" />
                      <div className="h-3 bg-slate-900 rounded animate-pulse w-5/6" />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Analýza kompatibility</h4>
                      {genreData.length > 0 ? (
                        <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                          <p>
                            Vaše filmové světy se nejvýrazněji protínají v oblasti: <strong className="text-amber-400 font-semibold">{genreData[0]?.name}</strong>. 
                          </p>
                          {genreData[1] && (
                            <p>
                              Sekundárním tmelem vašeho vztahu je žánr <strong className="text-slate-200 font-semibold">{genreData[1].name}</strong>, což značí velmi vybalancovaný vkus.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Zde se objeví textové vyhodnocení vašeho páru, jakmile systém získá dostatek vzájemných shod.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-900/80 pt-4 mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Jak to počítáme?</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block">
                      Vibe Score reflektuje shodu v preferencích u titulů, které viděli oba uživatelé. Rozdílné reakce (Like vs. Dislike) skóre snižují.
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#05070c]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    }>
      <PremiumDashboard />
    </Suspense>
  );
}