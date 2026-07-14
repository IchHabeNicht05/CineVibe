"use client";

import { useState, useEffect } from "react";
import { Loader2, Play, ChevronDown, Flame } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MovieCard from "@/components/MovieCard"; // Naše sjednocená karta!

// Varianty pro postupné animování prvků v Hero Banneru
const heroContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function SerialyPage() {
  const [shows, setShows] = useState<any[]>([]);
  const [heroShow, setHeroShow] = useState<any | null>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // Načtení watchlistu z localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cinevibe_watchlist");
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // Načtení žánrů pro TV show
  useEffect(() => {
    fetch("/api/tmdb?type=tv&endpoint=genres")
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch((err) => console.error(err));
  }, []);

  // Načtení Hero banneru (Trending seriálů)
  useEffect(() => {
    fetch("/api/tmdb?type=tv&endpoint=trending&page=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          setHeroShow(data.results[0]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Načtení seriálů
  useEffect(() => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    fetch(`/api/tmdb?type=tv&endpoint=discover&genre=${selectedGenre}&sort=${sortBy}&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          if (page === 1) {
            const filtered = data.results.filter((s: any) => s.id !== heroShow?.id);
            setShows(filtered);
          } else {
            setShows((prev) => [...prev, ...data.results]);
          }
        }
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setLoadingMore(false);
      });
  }, [selectedGenre, sortBy, page, heroShow]);

  const handleToggleWatchlist = (item: any) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      const updated = exists ? prev.filter((w) => w.id !== item.id) : [...prev, item];
      localStorage.setItem("cinevibe_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 overflow-x-hidden">
      {/* HERO BANNER */}
      <AnimatePresence>
        {heroShow && (
          <div className="relative h-[65vh] w-full overflow-hidden flex items-end">
            <div className="absolute inset-0 z-0">
              <motion.img
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.35 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                src={`https://image.tmdb.org/t/p/original${heroShow.backdrop_path}`}
                alt={heroShow.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
            </div>

            <motion.div
              variants={heroContainerVariants}
              initial="hidden"
              animate="show"
              className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12 w-full"
            >
              <motion.span variants={heroItemVariants} className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 inline-block">
                Seriálový hit
              </motion.span>
              <motion.h1 variants={heroItemVariants} className="text-3xl sm:text-5xl font-black tracking-tight mb-4 max-w-3xl leading-tight">
                {heroShow.name}
              </motion.h1>
              <motion.p variants={heroItemVariants} className="text-slate-300 text-sm sm:text-base max-w-2xl line-clamp-3 mb-6 font-medium">
                {heroShow.overview}
              </motion.p>
              <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/tv/${heroShow.id}`}
                  className="flex items-center gap-2 bg-white text-slate-950 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm"
                >
                  <Play size={16} fill="currentColor" /> Detail seriálu
                </Link>
                <Link
                  href="/swipe"
                  className="flex items-center gap-2 bg-red-600/15 border border-red-500/30 text-red-400 font-bold px-6 py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all text-sm"
                >
                  <Flame size={16} className="animate-pulse" /> Spustit Swipe
                </Link>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FILTRY A SEZNAM */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Objevuj seriály</h2>
            <p className="text-xs text-slate-400 mt-1">Najdi maratónský seriál pro tebe a tvé přátele.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 px-4 py-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-red-500/50 cursor-pointer"
              >
                <option value="popularity.desc">Nejpopulárnější</option>
                <option value="vote_average.desc">Nejlépe hodnocené</option>
                <option value="first_air_date.desc">Nejnovější</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ŽÁNRY (S plynulým přesouváním červeného pozadí) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none relative z-10">
          <button
            onClick={() => handleGenreChange("")}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer duration-200
              ${selectedGenre === "" ? "text-white" : "text-slate-400 hover:text-white"}`}
          >
            {selectedGenre === "" && (
              <motion.div
                layoutId="activeGenreIndicator"
                className="absolute inset-0 bg-red-600 rounded-xl shadow-lg shadow-red-600/20"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Všechny žánry</span>
          </button>
          
          {genres.map((genre) => {
            const isActive = selectedGenre === genre.id.toString();
            return (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id.toString())}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer duration-200
                  ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeGenreIndicator"
                    className="absolute inset-0 bg-red-600 rounded-xl shadow-lg shadow-red-600/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{genre.name}</span>
              </button>
            );
          })}
        </div>

        {/* PROLÍNAČ MEZI LOADINGEM A OBSAHEM */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-24 gap-3"
            >
              <Loader2 size={32} className="animate-spin text-red-500" />
              <p className="text-xs text-slate-400 font-medium">Načítám televizní trháky...</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {shows.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-2xl">
                  <p className="text-slate-400 font-medium text-sm">Žádné seriály neodpovídají filtrům.</p>
                </div>
              ) : (
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {shows.map((show, index) => (
                    <motion.div
                      key={show.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: (index % 10) * 0.04, ease: "easeOut" }}
                    >
                      <MovieCard
                        movie={show}
                        mediaType="tv"
                        isWatchlisted={watchlist.some((w) => w.id === show.id)}
                        onToggleWatchlist={() => handleToggleWatchlist(show)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* NAČÍST DALŠÍ */}
              {shows.length > 0 && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-red-500" />
                        Načítám...
                      </>
                    ) : (
                      "Načíst další seriály"
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}