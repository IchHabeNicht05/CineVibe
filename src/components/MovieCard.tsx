// src/components/MovieCard.tsx
import Link from "next/link";
import { Movie } from "@/types"; 
import { Star, Calendar, Bookmark } from "lucide-react"; // PŘIDÁN BOOKMARK

interface MovieCardProps {
  movie: Movie; // OPRAVENO: Používáme tvůj TypeScript typ místo 'any'
  mediaType?: "movie" | "tv"; 
  isWatchlisted?: boolean;       // NOVÉ
  onToggleWatchlist?: () => void; // NOVÉ
}

export default function MovieCard({ 
  movie, 
  mediaType = "movie", 
  isWatchlisted = false, 
  onToggleWatchlist 
}: MovieCardProps) {
  
  const title = movie.title || movie.name;
  
  const localizedType = mediaType === "movie" ? "film" : "tv";
  const linkHref = `/${localizedType}/${movie.id}`;
  
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? releaseDate.substring(0, 4) : "";

  return (
    <Link href={linkHref} className="group relative flex flex-col gap-2">
      {/* OBRÁZEK PLAKÁTU */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-800 shadow-md transition-all duration-300 group-hover:shadow-red-500/20">
        
        {/* NOVÉ: TLAČÍTKO PRO WATCHLIST (ZÁLOŽKA) */}
        {onToggleWatchlist && (
          <button
            type="button"
            aria-label={isWatchlisted ? "Odebrat z výběru" : "Uložit do výběru"}
            onClick={(e) => {
              e.preventDefault();  // Zamezí chování odkazu <Link>
              e.stopPropagation(); // Zamezí šíření kliknutí do rodičovských prvků
              onToggleWatchlist();
            }}
            className="absolute top-2.5 right-2.5 z-30 p-2 rounded-xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/50 backdrop-blur-md text-white transition-all active:scale-90 shadow-md"
          >
            <Bookmark 
              size={15} 
              className={isWatchlisted ? "fill-red-500 text-red-500" : "text-slate-300 group-hover/btn:text-white"} 
            />
          </button>
        )}

        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-500">
            Bez obrázku
          </div>
        )}
        
        {/* Ztmavení při najetí */}
        <div className="absolute inset-0 bg-slate-950/0 transition-colors duration-300 group-hover:bg-slate-950/40" />
      </div>

      {/* INFORMACE POD PLAKÁTEM */}
      <div className="mt-1 flex flex-col gap-1">
        <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-red-500 sm:text-base">
          {title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-slate-400">
          {year && (
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-slate-500" />
              {year}
            </span>
          )}
          {movie.vote_average > 0 && (
            <span className="flex items-center gap-1 font-medium text-amber-400">
              <Star size={12} className="fill-amber-400" />
              {movie.vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}