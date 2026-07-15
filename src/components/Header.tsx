/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Film, 
  Search, 
  User, 
  X, 
  LogOut, 
  Loader2, 
  Flame, 
  Menu, 
  LogIn, 
  Star, 
  ChevronRight, 
  Crown,
  Tv,
  Bookmark,
  Home
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Stavy pro UI panely
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Stavy pro vyhledávání a našeptávač
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  
  // Index aktivní položky při navigaci šipkami
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Stavy pro Match místnosti
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  // Přihlášený uživatel a jeho Premium status ze Supabase
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Pomocná funkce pro zjištění, zda je odkaz aktivní
  const isActive = (path: string) => pathname === path;

  // Skládaná přezdívka pro zobrazení (přezdívka z místnosti -> email ze Supabase -> anonym)
  const displayUser = activeUser || supabaseUser?.email?.split("@")[0] || "Uživatel";

  // Načtení relací, sledování změn a ověření Premium profilu při startu
  useEffect(() => {
    // 1. Kontrola aktivní místnosti v localStorage
    const checkRoomSession = () => {
      setActiveUser(localStorage.getItem("cinevibe_user"));
      setActiveRoom(localStorage.getItem("cinevibe_room"));
    };
    
    checkRoomSession();
    window.addEventListener("storage", checkRoomSession);
    window.addEventListener("cinevibe_session_changed", checkRoomSession);

    // Funkce pro bezpečné vytažení Premium statusu z DB
    const fetchPremiumStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", userId)
          .maybeSingle();

        if (data) {
          setIsPremium(!!data.is_premium);
        } else {
          setIsPremium(false);
        }
      } catch (err) {
        console.error("Chyba při načítání premium statusu:", err);
        setIsPremium(false);
      }
    };

    // 2. Kontrola přihlášení při prvním načtení
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setSupabaseUser(user);
      if (user) fetchPremiumStatus(user.id);
    });

    // 3. Sledování změn stavu přihlášení (onAuthStateChange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setSupabaseUser(user);
      if (user) {
        fetchPremiumStatus(user.id);
      } else {
        setIsPremium(false);
      }
    });

    return () => {
      window.removeEventListener("storage", checkRoomSession);
      window.removeEventListener("cinevibe_session_changed", checkRoomSession);
      subscription.unsubscribe();
    };
  }, []);

  // Autofokus na vyhledávací input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setFocusedIndex(-1);
  }, [isSearchOpen]);

  // Vyhledávací našeptávač (Debounce 300ms)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setFocusedIndex(-1);
        return;
      }
      setIsFetchingSuggestions(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results.slice(0, 5));
          setFocusedIndex(-1);
        }
      } catch (err) {
        console.error("Chyba při načítání našeptávače:", err);
      } finally {
        setIsFetchingSuggestions(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performFullSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      setQuery("");
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (id: number, type: string) => {
    router.push(`/${type === 'tv' ? 'tv' : 'film'}/${id}`);
    setIsSearchOpen(false);
    setQuery("");
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    const maxIndex = suggestions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        const selected = suggestions[focusedIndex];
        handleSuggestionClick(selected.id, selected.media_type);
      } else if (focusedIndex === suggestions.length || focusedIndex === -1) {
        performFullSearch();
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performFullSearch();
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("cinevibe_user");
    localStorage.removeItem("cinevibe_room");
    setActiveUser(null);
    setActiveRoom(null);
    setIsProfileOpen(false);
    window.dispatchEvent(new Event("cinevibe_session_changed"));
    router.push("/");
  };

  const handleSupabaseSignOut = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    router.refresh();
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    setQuery("");
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsSearchOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 relative">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/[0.08] shadow-lg shadow-red-500/10">
            <Image
              src="/icon.png"
              alt="CineVibe Logo"
              width={56}
              height={56}
              priority
              className="object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Cine<span className="text-red-500">Vibe</span>
          </span>
        </Link>
        
        {/* NAVIGACE (DESKTOP) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-300">
          <Link 
            href="/" 
            className={`px-3 py-2 rounded-full transition-all ${
              isActive("/") ? "text-white bg-slate-800/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Domů
          </Link>
          
          {/* NOVÉ PODSTRÁNKY */}
          <Link 
            href="/film" 
            className={`px-3 py-2 rounded-full transition-all ${
              isActive("/film") ? "text-white bg-slate-800/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Filmy
          </Link>
          <Link 
            href="/tv" 
            className={`px-3 py-2 rounded-full transition-all ${
              isActive("/tv") ? "text-white bg-slate-800/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Seriály
          </Link>

          <Link 
            href="/kolekce" 
            className={`px-3 py-2 rounded-full transition-all ${
              isActive("/kolekce") ? "text-white bg-slate-800/40" : "hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Kolekce
          </Link>
          <Link 
            href="/swipe" 
            className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
              isActive("/swipe") ? "text-red-400 bg-red-500/10" : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
            }`}
          >
            <Flame size={16} className="group-hover:animate-pulse" />
            Match
          </Link>

          {/* PREMIUM SEKCE
          <Link
            href="/premium"
            className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
              isActive("/premium") 
                ? "text-amber-400 bg-amber-500/10" 
                : "text-slate-300 hover:text-amber-400 hover:bg-amber-500/5"
            }`}
          >
            <Crown 
              size={16} 
              className={`transition-all duration-300 ${
                isPremium 
                  ? "text-amber-400 fill-amber-400/20 animate-pulse" 
                  : "text-slate-400 group-hover:text-amber-400"
              }`} 
            />
            <span>Vibe Stats</span>
            {!isPremium && (
              <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                PRO
              </span>
            )}
          </Link>
          */}
        </nav>

        {/* AKČNÍ TLAČÍTKA VPRAVO */}
        <div className="flex items-center gap-1 sm:gap-2 text-slate-300">
          
          {/* Hledání */}
          <button 
            onClick={toggleSearch}
            aria-label="Vyhledávání"
            className={`transition-all duration-300 p-2.5 rounded-full flex items-center justify-center 
              ${isSearchOpen ? 'text-white bg-slate-800 shadow-inner' : 'hover:text-white hover:bg-slate-800/50'}`}
          >
            {isSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Profil a stav místnosti */}
          <div className="relative">
            <button 
              onClick={toggleProfile} 
              aria-label="Profil a místnost"
              className={`transition-all duration-300 p-2.5 rounded-full relative flex items-center justify-center
                ${isProfileOpen ? 'text-white bg-slate-800 shadow-inner' : 'hover:text-white hover:bg-slate-800/50'}
                ${supabaseUser ? 'border border-red-500/30 bg-red-500/5 text-red-400' : ''}`}
            >
              <User size={18} />
              {(activeRoom || supabaseUser) && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-14 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl text-white z-50 origin-top-right space-y-4"
                >
                  <div className="border-b border-slate-800 pb-3">
                    {supabaseUser ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Přihlášený účet</span>
                          </div>
                          {isPremium && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Crown size={10} className="fill-amber-400" /> PREMIUM
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-200 truncate">{supabaseUser.email}</p>
                        <button
                          onClick={handleSupabaseSignOut}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors pt-1 cursor-pointer"
                        >
                          <LogOut size={12} /> Odhlásit se z webu
                        </button>
                      </div>
                    ) : (
                      <div className="py-1">
                        <p className="text-xs text-slate-400 mb-2.5">Pro ukládání do kolekcí a psaní diskuzí se přihlaste.</p>
                        <Link
                          href="/login"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 border border-slate-700/60 p-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
                        >
                          <LogIn size={14} />
                          Přihlásit se k účtu
                        </Link>
                      </div>
                    )}
                  </div>

                  <div>
                    {activeRoom ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Místnost</span>
                        </div>
                        <div className="space-y-2.5 rounded-xl bg-slate-950/50 p-3 border border-slate-800/80 mb-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Přezdívka</span>
                            <span className="font-bold text-white">{displayUser}</span>
                          </div>
                          <div className="h-px w-full bg-slate-800/60" />
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Kód</span>
                            <span className="font-black text-red-400 tracking-wider bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase text-[10px]">
                              {activeRoom}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleLeaveRoom}
                          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer"
                        >
                          <LogOut size={14} className="transition-transform group-hover:-translate-x-0.5" /> 
                          Opustit místnost
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-1">
                        <h4 className="font-bold text-xs text-slate-400 mb-2">Žádná aktivní místnost</h4>
                        <Link 
                          href="/swipe" 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-red-600 p-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/10 transition-all hover:bg-red-500 hover:shadow-red-500/20 active:scale-95"
                        >
                          <Flame size={14} />
                          Založit Místnost
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger (mobil) */}
          <button 
            onClick={toggleMobileMenu}
            aria-label="Menu"
            className="md:hidden p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* --- VYHLEDÁVACÍ PANEL POD HEADEREM --- */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full bg-slate-950 border-t border-slate-800/60 shadow-2xl relative"
          >
            <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Hledat filmy, seriály..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setSuggestions([]); setFocusedIndex(-1); }}
                    className="absolute right-3 p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </form>

              {/* Box s našepkávanými výsledky */}
              <AnimatePresence>
                {(isFetchingSuggestions || suggestions.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 rounded-xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-xl divide-y divide-slate-800/40 overflow-hidden shadow-2xl"
                  >
                    {isFetchingSuggestions && suggestions.length === 0 && (
                      <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                        <Loader2 size={14} className="animate-spin text-red-500" />
                        Vyhledávání...
                      </div>
                    )}
                    
                    {suggestions.map((item, index) => {
                      const isFocused = index === focusedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSuggestionClick(item.id, item.media_type)}
                          onMouseEnter={() => setFocusedIndex(index)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all group duration-150
                            ${isFocused ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-800/40'}`}
                        >
                          <div className="flex items-center gap-4 min-w-0 pr-2">
                            {item.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
                                alt={item.title || item.name}
                                className={`h-12 w-8 shrink-0 rounded object-cover shadow-sm transition-transform duration-200
                                  ${isFocused ? 'scale-105 shadow-md shadow-black/40' : 'group-hover:scale-105'}`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-12 w-8 items-center justify-center bg-slate-950 border border-slate-800/60 rounded shrink-0 text-slate-600 text-[10px] font-bold">
                                NO IM
                              </div>
                            )}
                            
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                                {item.title || item.name}
                              </p>
                              
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                                <span>
                                  {item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : "—"}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className={`text-[10px] uppercase font-bold tracking-wider 
                                  ${item.media_type === 'tv' ? 'text-blue-400/90' : 'text-amber-500/90'}`}>
                                  {item.media_type === 'tv' ? 'Seriál' : 'Film'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {item.vote_average > 0 && (
                              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded-lg">
                                <Star size={11} fill="currentColor" />
                                {item.vote_average.toFixed(1)}
                              </div>
                            )}
                            <ChevronRight 
                              size={14} 
                              className={`text-slate-600 transition-all duration-200
                                ${isFocused ? 'translate-x-0.5 text-red-400' : 'group-hover:translate-x-0.5 group-hover:text-slate-400'}`} 
                            />
                          </div>
                        </button>
                      );
                    })}

                    {suggestions.length > 0 && (
                      <button
                        onClick={performFullSearch}
                        onMouseEnter={() => setFocusedIndex(suggestions.length)}
                        className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-all group duration-150 border-t border-slate-800/40
                          ${focusedIndex === suggestions.length 
                            ? 'bg-red-500/10 text-red-400 font-bold' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40 font-medium'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Search size={14} className={focusedIndex === suggestions.length ? 'text-red-400' : 'text-slate-500'} />
                          <span className="text-sm">Zobrazit všechny výsledky pro „{query}“</span>
                        </div>
                        <ChevronRight 
                          size={14} 
                          className={`transition-all duration-200
                            ${focusedIndex === suggestions.length ? 'translate-x-0.5 text-red-400' : 'text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-400'}`} 
                        />
                      </button>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILNÍ NAVIGAČNÍ MENU --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden w-full overflow-hidden bg-slate-950 border-t border-slate-800/60 shadow-2xl"
          >
            <nav className="flex flex-col p-4 gap-1.5 text-base font-semibold">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition-all">
              <Home size={18} className="text-slate-400" />
                Domů
              </Link>
              <Link href="/film" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition-all">
                <Film size={18} className="text-slate-400" />
                Filmy
              </Link>
              <Link href="/tv" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition-all">
                <Tv size={18} className="text-slate-400" />
                Seriály
              </Link>
              <Link href="/kolekce" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition-all">
              <Bookmark size={18} className="text-slate-400" />
                Kolekce
              </Link>
              <Link href="/swipe" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold transition-all">
                <Flame size={18} className="animate-pulse" />
                Match (Swipe)
              </Link>

              {/* Premium v mobilním zobrazení
              <Link 
                href="/premium" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Crown size={18} className={isPremium ? "text-amber-400 fill-amber-400/10 animate-pulse" : "text-slate-400"} />
                  <span>Vibe Stats</span>
                </div>
                {!isPremium && (
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                    PRO
                  </span>
                )}
              </Link>
              */}
              
              <div className="h-px bg-slate-800/60 my-2" />
              
              {supabaseUser ? (
                <button
                  onClick={() => { handleSupabaseSignOut(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-left text-slate-400 hover:text-red-400 hover:bg-red-500/5 font-medium transition-all"
                >
                  <LogOut size={18} />
                  Odhlásit ({supabaseUser.email.split("@")[0]})
                </button>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 font-medium transition-all">
                  <LogIn size={18} />
                  Přihlásit se k účtu
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}