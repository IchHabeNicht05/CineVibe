"use client";

import { Movie } from "@/types";
import { Star, Flame, Bookmark } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  mediaType: "movie" | "tv";
  isWatchlisted: boolean;
  onToggleWatchlist?: () => void;
}

export default function MovieCard({
  movie,
  mediaType,
  isWatchlisted,
  onToggleWatchlist,
}: MovieCardProps) {
  // TMDB vrací pro filmy "title" a "release_date", ale pro seriály "name" a "first_air_date"
  const title = movie.title || movie.name || "Bez názvu";
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "—";
  
  // URL adresa detailu (podpora pro film i tv)
  const detailUrl = mediaType === "tv" ? `/tv/${movie.id}` : `/film/${movie.id}`;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Zabrání prokliknutí na detail při kliknutí na záložku
    if (onToggleWatchlist) {
      onToggleWatchlist();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="group flex h-full flex-col relative overflow-hidden rounded-2xl border border-slate-900/80 bg-[#0b1120]/60 backdrop-blur-sm transition-all duration-300 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/5"
    >
      {/* PLAKÁT S BADGES */}
      <div className="relative aspect-[2/3] w-full overflow-hidden block">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-xs font-semibold text-slate-500">
            Chybí plakát
          </div>
        )}

        {/* Gradient přes plakát pro lepší čitelnost horních prvků */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Hodnocení (Vlevo nahoře) */}
        {movie.vote_average !== undefined && movie.vote_average > 0 && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-950/80 px-2.5 py-1 text-[10px] font-black text-amber-400 shadow-lg backdrop-blur-md">
            <Star size={10} fill="currentColor" className="stroke-amber-400" />
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        {/* Záložka / Watchlist (Vpravo nahoře) */}
        {onToggleWatchlist && (
          <button
            onClick={handleBookmarkClick}
            className={`absolute top-3 right-3 z-10 p-2 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-200 active:scale-90 cursor-pointer
              ${
                isWatchlisted
                  ? "bg-red-600/90 border-red-500 text-white"
                  : "bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            title={isWatchlisted ? "Odebrat z výběru" : "Uložit do mého výběru"}
          >
            <Bookmark size={13} fill={isWatchlisted ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {/* TEXTOVÝ OBSAH */}
      <div className="flex flex-grow flex-col p-3.5">
        {/* Rok vydání */}
        <span className="mb-1 text-[10px] font-bold tracking-wider text-slate-500">
          {year}
        </span>

        {/* Název titulu */}
        <Link href={detailUrl} className="focus:outline-none">
          <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-slate-200 transition-colors duration-250 group-hover:text-white">
            {title}
          </h3>
        </Link>

        {/* PATIČKA KARTY (Interaktivní akce) */}
        <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between">
          {/* Tinder Swipe Link */}
          <Link
            href="/swipe"
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
          >
            <Flame size={12} className="animate-pulse text-red-500" fill="currentColor" />
            Swipe
          </Link>

          {/* Více Info Link */}
          <Link
            href={detailUrl}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Více info
          </Link>
        </div>
      </div>
    </motion.div>
  );
}