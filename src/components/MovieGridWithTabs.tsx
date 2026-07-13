// src/components/MovieGridWithTabs.tsx
"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/types";
import MovieCard from "./MovieCard";
import { Loader2, Sparkles, Flame, Clapperboard, Film, Tv, ArrowUpDown, Plus, Bookmark, Dices, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FILTER_SECTIONS = [
  { id: "popular", name: "Trendy", icon: Flame },
  { id: "now_playing", name: "Novinky", icon: Clapperboard },
  { id: "top_rated", name: "Nejlepší", icon: Sparkles },
  { id: "watchlist", name: "Můj výběr", icon: Bookmark },
];

const PROVIDER_SECTIONS = [
  { id: "netflix", name: "Netflix", logo: "/logos/netflix.webp" },
  { id: "hbo", name: "Max", logo: "/logos/hbo.png" },
  { id: "disney", name: "Disney+", logo: "/logos/disney.webp" },
  { id: "skyshowtime", name: "SkyShowtime", logo: "/logos/skyshowtime.png" },
  { id: "prime", name: "Prime Video", logo: "/logos/prime.webp" },
  { id: "apple", name: "Apple TV+", logo: "/logos/apple.jpg" },
];

// NOVÉ: Mapování žánrů pro Filmy i TV seriály na jednom místě
const GENRES = [
  { id: "all", name: "Všechny žánry" },
  { id: "action", name: "Akční & Dobrodružné", movie: "28,12", tv: "10759" },
  { id: "comedy", name: "Komedie", movie: "35", tv: "35" },
  { id: "romance", name: "Romantické", movie: "10749", tv: "18,10766" },
  { id: "drama", name: "Drama", movie: "18", tv: "18" },
  { id: "scifi", name: "Sci-Fi & Fantasy", movie: "878,14", tv: "10765" },
  { id: "thriller", name: "Krimi & Thriller", movie: "80,53", tv: "80" },
  { id: "horror", name: "Horor", movie: "27", tv: "9648" },
  { id: "family", name: "Rodinné & Animované", movie: "10751,16", tv: "10751,16" },
  { id: "documentary", name: "Dokumenty", movie: "99", tv: "99" },
];

interface MovieGridWithTabsProps {
  initialMovies: Movie[];
}

export default function MovieGridWithTabs({ initialMovies }: MovieGridWithTabsProps) {
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [activeTab, setActiveTab] = useState("popular");
  const [sortBy, setSortBy] = useState<"default" | "rating_desc" | "rating_asc">("default");
  const [page, setPage] = useState(1);
  const [fetchedItems, setFetchedItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const [region, setRegion] = useState<"CZ" | "US">("CZ");
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [randomItem, setRandomItem] = useState<Movie | null>(null);
  
  // NOVÝ STAV PRO ŽÁNR
  const [selectedGenre, setSelectedGenre] = useState<string>("all");

  // Výchozí zobrazení platí pouze tehdy, pokud nemáme vybraný žádný specifický žánr
  const isDefaultView = activeTab === "popular" && mediaType === "movie" && region === "CZ" && selectedGenre === "all";

  useEffect(() => {
    const saved = localStorage.getItem("cinevibe_watchlist");
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // Reset stránek při jakékoliv změně filtrů (včetně žánru)
  useEffect(() => {
    setPage(1);
    setFetchedItems([]);
    setSortBy("default");
  }, [activeTab, mediaType, region, selectedGenre]);

  useEffect(() => {
    if ((isDefaultView && page === 1) || activeTab === "watchlist") {
      return;
    }

    const fetchSectionContent = async () => {
      setLoading(true);
      
      // Zjistíme správné TMDB ID pro aktuální typ média (film/tv)
      const genreObj = GENRES.find((g) => g.id === selectedGenre);
      const genreIdParam = genreObj && genreObj.id !== "all" 
        ? (mediaType === "movie" ? genreObj.movie : genreObj.tv) 
        : "";

      try {
        const res = await fetch(
          `/api/movies/sections?type=${activeTab}&media=${mediaType}&page=${page}&region=${region}&genre=${genreIdParam}`
        );
        if (res.ok) {
          const data = await res.json();
          if (page === 1) {
            setFetchedItems(data);
          } else {
            setFetchedItems((prev) => [...prev, ...data]);
          }
        }
      } catch (err) {
        console.error("Chyba při stahování obsahu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSectionContent();
  }, [activeTab, mediaType, page, region, selectedGenre, isDefaultView]);

  const handleToggleWatchlist = (movie: Movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((item) => item.id === movie.id);
      const updated = exists ? prev.filter((item) => item.id !== movie.id) : [...prev, movie];
      localStorage.setItem("cinevibe_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  const handlePickRandom = () => {
    if (itemsToShow.length === 0) return;
    const randomIndex = Math.floor(Math.random() * itemsToShow.length);
    setRandomItem(itemsToShow[randomIndex]);
  };

  // VÝPOČET ZOBRAZOVANÝCH POLOŽEK
  const getSortedItems = () => {
    let baseItems: Movie[] = [];

    if (activeTab === "watchlist") {
      baseItems = watchlist.filter((item) => 
        mediaType === "movie" ? !!item.title : !!item.name
      );

      // Klientské filtrování žánrů uvnitř Watchlistu!
      if (selectedGenre !== "all") {
        const genreObj = GENRES.find((g) => g.id === selectedGenre);
        if (genreObj) {
          const activeGenreIds = (mediaType === "movie" ? genreObj.movie : genreObj.tv)
            .split(",")
            .map(Number);

          baseItems = baseItems.filter((item) =>
            item.genre_ids?.some((id) => activeGenreIds.includes(id))
          );
        }
      }
    } else {
      baseItems = isDefaultView 
        ? (page === 1 ? initialMovies : [...initialMovies, ...fetchedItems]) 
        : fetchedItems;
    }

    if (!baseItems) return [];
    const itemsCopy = [...baseItems];

    if (sortBy === "rating_desc") return itemsCopy.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    if (sortBy === "rating_asc") return itemsCopy.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
    return baseItems;
  };

  const itemsToShow = getSortedItems();
  const isMovie = mediaType === "movie";
  const contentLabel = isMovie ? "filmy" : "seriály";
  const contentLabelCapital = isMovie ? "Filmy" : "Seriály";

  const currentInfo = FILTER_SECTIONS.find((t) => t.id === activeTab) || PROVIDER_SECTIONS.find((t) => t.id === activeTab);

  const getDescription = () => {
    if (activeTab === "watchlist") return `Tvoje osobní sbírka. Máš zde rozkoukané nebo uložené ${contentLabel}.`;
    switch (activeTab) {
      case "popular": return `Nejpopularnější ${contentLabel} tohoto týdne v regionu ${region}.`;
      case "now_playing": return isMovie ? "Čerstvé novinky v kinech." : "Nové epizody a seriály v vysílání.";
      case "top_rated": return `Klenoty s nejvyšším hodnocením.`;
      default: return `Objevuj ${contentLabel} na platformě ${currentInfo?.name}.`;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-16">
      
      {/* HLAVIČKA A TITULEK */}
      <div className="mb-8 flex flex-col gap-6 border-b border-slate-900 pb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl flex items-center gap-3">
            {currentInfo?.name || "Objevuj"}
            <span className="text-red-500 text-sm font-black uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md">
              {contentLabelCapital}
            </span>
          </h2>
          <p className="mt-2 text-slate-400 text-sm leading-relaxed min-h-[40px]">
            {getDescription()}
          </p>
        </div>

        <div className="flex flex-col gap-4 items-start lg:items-end">
          <div className="flex items-center gap-4">
            {activeTab !== "watchlist" && (
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold shadow-inner">
                <button onClick={() => setRegion("CZ")} className={`px-3 py-1.5 rounded-lg transition-all ${region === "CZ" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>🇨🇿 CZ</button>
                <button onClick={() => setRegion("US")} className={`px-3 py-1.5 rounded-lg transition-all ${region === "US" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>🇺🇸 US</button>
              </div>
            )}

            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-700/80 shadow-lg">
              <button onClick={() => setMediaType("movie")} className={`relative flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${isMovie ? "text-white" : "text-slate-400 hover:text-white"}`}>
                {isMovie && <motion.div layoutId="mediaTypeIndicator" className="absolute inset-0 rounded-lg bg-red-600 shadow-md" transition={{ type: "spring", stiffness: 300, damping: 25 }} />}
                <span className="relative z-10 flex items-center gap-2"><Film size={16} />Filmy</span>
              </button>
              <button onClick={() => setMediaType("tv")} className={`relative flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${!isMovie ? "text-white" : "text-slate-400 hover:text-white"}`}>
                {!isMovie && <motion.div layoutId="mediaTypeIndicator" className="absolute inset-0 rounded-lg bg-red-600 shadow-md" transition={{ type: "spring", stiffness: 300, damping: 25 }} />}
                <span className="relative z-10 flex items-center gap-2"><Tv size={16} />Seriály</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-xl bg-slate-900/60 p-1 border border-slate-800/80 backdrop-blur-sm">
              {FILTER_SECTIONS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}>
                    {isActive && <motion.div layoutId="activeGridTabIndicator" className="absolute inset-0 rounded-lg bg-slate-800 shadow-md border border-slate-700/40" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                    <span className="relative z-10 flex items-center gap-1.5"><Icon size={13} className={isActive ? "text-red-500" : ""} />{tab.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex rounded-xl bg-slate-900/60 p-1 border border-slate-800/80 backdrop-blur-sm gap-2">
              {PROVIDER_SECTIONS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative p-1 rounded-lg overflow-hidden transition-transform duration-150 active:scale-95" title={tab.name}>
                    {isActive && <motion.div layoutId="activeGridTabIndicator" className="absolute inset-0 rounded-lg bg-red-500/10 border border-red-500/30 z-0" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                    <img src={tab.logo} alt={tab.name} className={`relative z-10 h-10 w-10 rounded-md object-cover transition-all duration-200 ${isActive ? "opacity-100 scale-105 shadow-lg shadow-black/80 ring-1 ring-slate-500/30" : "opacity-30 grayscale hover:opacity-80 hover:grayscale-0"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* NOVÝ ŽÁNROVÝ FILTR (Pill buttons s horizontálním scrollem na mobilu) */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none border-b border-slate-950">
        {GENRES.map((genre) => {
          const isActive = selectedGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 border ${
                isActive
                  ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20"
                  : "bg-slate-900/40 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700"
              }`}
            >
              {genre.name}
            </button>
          );
        })}
      </div>

      {/* STRÁNKOVACÍ / ŘADÍCÍ LIŠTA + GENERÁTOR */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 bg-slate-900/20 border border-slate-900/60 p-3 rounded-xl backdrop-blur-sm">
        <div>
          Zobrazeno: <span className="font-bold text-slate-200">{itemsToShow?.length || 0}</span> {contentLabel} {activeTab !== "watchlist" && `(strana ${page})`}
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {itemsToShow.length > 0 && (
            <button
              onClick={handlePickRandom}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 text-red-400 font-bold transition-all active:scale-95"
              title="Vybrat náhodný film z této nabídky"
            >
              <Dices size={14} className="animate-pulse" />
              Co si pustit?
            </button>
          )}

          <div className="flex items-center gap-2">
            <ArrowUpDown size={13} className="text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-slate-300 font-semibold focus:outline-none focus:border-red-500/50 cursor-pointer"
            >
              <option value="default">Výchozí (Doporučené)</option>
              <option value="rating_desc">Nejlépe hodnocené (★ 10 → 1)</option>
              <option value="rating_asc">Nejhůře hodnocené (★ 1 → 10)</option>
            </select>
          </div>
        </div>
      </div>

      {/* MŘÍŽKA S OBSAHEM */}
      <div className="relative min-h-[400px]">
        {loading && page === 1 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 pt-20">
            <Loader2 size={36} className="animate-spin text-red-500" />
            <p className="text-sm font-medium tracking-wide uppercase">Ladím streamovací frekvence pro {contentLabel}...</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
              {itemsToShow?.length > 0 ? (
                itemsToShow.map((item) => (
                  <MovieCard 
                    key={item.id} 
                    movie={item} 
                    mediaType={mediaType}
                    isWatchlisted={watchlist.some(w => w.id === item.id)}
                    onToggleWatchlist={() => handleToggleWatchlist(item)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-500">
                  {activeTab === "watchlist" ? `Tvůj watchlist pro ${contentLabel} je prázdný nebo neodpovídá zvolenému žánru.` : `Pro tuto kombinaci nebyly nalezeny žádné ${contentLabel}.`}
                </div>
              )}
            </div>

            {itemsToShow?.length > 0 && activeTab !== "watchlist" && (
              <div className="mt-12 flex justify-center border-t border-slate-900 pt-8">
                <button
                  disabled={loading}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 hover:border-slate-700 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin text-red-500" />Načítám další vlnu...</>
                  ) : (
                    <><Plus size={16} className="text-slate-400 group-hover:text-white group-hover:rotate-90 transition-transform" />Načíst další {contentLabel}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ANIMOVANÝ MODAL PRO NÁHODNÝ VÝBĚR */}
      <AnimatePresence>
        {randomItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative max-w-sm w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
              <button onClick={() => setRandomItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              <div className="mb-2 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full animate-bounce">🍿 Dneska koukáš na toto!</div>
              <div className="w-full my-4 text-left pointer-events-none">
                <MovieCard movie={randomItem} mediaType={mediaType} isWatchlisted={watchlist.some(w => w.id === randomItem.id)} />
              </div>
              <button onClick={handlePickRandom} className="mt-2 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 font-bold py-3 px-4 rounded-xl text-white transition-colors shadow-lg shadow-red-600/20">
                <Dices size={16} />To se mi nelíbí, zkus jiný
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}