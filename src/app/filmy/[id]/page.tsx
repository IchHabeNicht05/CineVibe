/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { Star, Calendar, Clock, Users, Play, Info, Building2, Wallet, Banknote, Film } from "lucide-react";
import { AnimateFadeIn, StaggerContainer, StaggerItem } from "./AnimationWrappers"; 
import Discussion from "@/components/Discussion";
import WatchProviders from "@/components/WatchProviders"; // NAŠÍ NOVÝ IMPORT
import { Suspense } from "react"; // NAŠÍ NOVÝ IMPORT

async function getMovieDetails(id: string) {
  if (!process.env.TMDB_API_KEY) {
    return { error: "Chybí API klíč" };
  }

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=cs-CZ&append_to_response=credits,videos`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { error: `Chyba API: ${res.status}` };
    return res.json();
  } catch (err) {
    return { error: "Nepodařilo se připojit k TMDB" };
  }
}

// ODEBRALI JSME: getWatchProviders a getLocalProviderLogo odsud!

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // NAČÍTÁME POUZE DETAIL FILMU, stránka se díky tomu načte bleskově!
  const movie = await getMovieDetails(resolvedParams.id);

  if (movie?.error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-xl max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Jejda, něco se pokazilo</h2>
          <p>{movie.error}</p>
        </div>
      </div>
    );
  }

  if (!movie || !movie.id) {
    notFound();
  }

  const trailer = movie.videos?.results?.find(
    (vid: any) => vid.site === "YouTube" && vid.type === "Trailer"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 pb-20 overflow-x-hidden">
      
      {/* ... (Celá horní hero a poster část zůstává beze změny) ... */}
      <div className="relative w-full h-[45vh] md:h-[50vh] bg-slate-900 overflow-hidden">
        {movie.backdrop_path ? (
          <AnimateFadeIn type="image" className="absolute inset-0 w-full h-full">
            <img
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover object-top opacity-25 scale-105"
                />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          </AnimateFadeIn>
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 relative -mt-32 md:-mt-48 z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          
          <AnimateFadeIn delay={0.2} className="w-48 md:w-1/3 flex-shrink-0 mx-auto md:mx-0">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-slate-800/80"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-slate-800 rounded-2xl flex items-center justify-center ring-1 ring-slate-700">
                <Film size={48} className="text-slate-600" />
              </div>
            )}
          </AnimateFadeIn>
          
          <StaggerContainer className="w-full md:w-2/3 flex flex-col justify-end pt-4 md:pt-16">
            <StaggerItem>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                {movie.title}
              </h1>
            </StaggerItem>

            {movie.tagline && (
              <StaggerItem>
                <p className="text-xl italic text-slate-400 font-medium mb-4">
                  "{movie.tagline}"
                </p>
              </StaggerItem>
            )}
            
            <StaggerItem>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-6">
                {movie.release_date && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar size={16} className="text-red-500" />
                    {movie.release_date.substring(0, 4)}
                  </div>
                )}
                
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star size={16} className="fill-amber-400" />
                    {movie.vote_average.toFixed(1)} <span className="text-slate-500">({movie.vote_count})</span>
                  </div>
                )}

                {movie.runtime > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock size={16} className="text-red-500" />
                    {movie.runtime} min
                  </div>
                )}

                <div className="px-2 py-0.5 rounded bg-slate-800/80 text-xs uppercase tracking-wider border border-slate-700">
                  {movie.status === "Released" ? "Vydáno" : movie.status}
                </div>
              </div>
            </StaggerItem>

            {movie.genres && movie.genres.length > 0 && (
              <StaggerItem>
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map((genre: any) => (
                    <span key={genre.id} className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-sm font-semibold">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </StaggerItem>
            )}

            <StaggerItem>
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Info size={20} className="text-red-500" />
                  O filmu
                </h3>
                <p className="text-lg leading-relaxed text-slate-300/90 text-balance md:text-left">
                  {movie.overview || "Popis zatím není k dispozici."}
                </p>
              </div>
            </StaggerItem>

            {trailer && (
              <StaggerItem>
                <div className="mb-10">
                  <a 
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 duration-200"
                  >
                    <Play size={20} className="fill-white" />
                    Přehrát trailer
                  </a>
                </div>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>

        {/* --- SPODNÍ SEKCE: KDE SLEDOVAT A DETAILY --- */}
        <AnimateFadeIn delay={0.4} className="mt-12 grid grid-cols-1 gap-8 border-t border-slate-800/60 pt-10 md:grid-cols-2">
          
          {/* LEVÁ STRANA: Kde sledovat s naším novým komponentem */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Film size={24} className="text-red-500" />
              Kde sledovat v ČR
              <span className="text-xs font-normal text-slate-500 ml-2">(v předplatném)</span>
            </h3>
            
            {/* VOLÁNÍ SKELETONU A KOMPONENTY */}
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                <div className="h-20 bg-slate-900 rounded-xl border border-slate-800/40" />
                <div className="h-20 bg-slate-900 rounded-xl border border-slate-800/40" />
              </div>
            }>
              <WatchProviders id={resolvedParams.id} type="movie" />
            </Suspense>
          </div>

          {/* PRAVÁ STRANA: Podrobné detaily */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Info size={24} className="text-red-500" />
              Detaily o filmu
            </h3>
            
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
                <span className="text-slate-400 font-medium flex items-center gap-2"><Wallet size={16} /> Rozpočet</span>
                <span className="text-slate-200 font-semibold font-mono">
                  {movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : "Neznámý"}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
                <span className="text-slate-400 font-medium flex items-center gap-2"><Banknote size={16} /> Tržby</span>
                <span className="text-emerald-400 font-semibold font-mono">
                  {movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : "Neznámý"}
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <span className="text-slate-400 font-medium flex items-center gap-2"><Building2 size={16} /> Produkční společnosti</span>
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  {movie.production_companies && movie.production_companies.length > 0 ? (
                    Array.from(new Set(movie.production_companies.map((c: any) => c.name))).map((companyName: any, index: number) => (
                      <span key={index} className="rounded-lg bg-slate-800 px-3 py-1.5 border border-slate-700">
                        {companyName}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">Neznámá produkce</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </AnimateFadeIn>

        {/* --- SEKCE: HERCI --- */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <AnimateFadeIn delay={0.5} className="mt-16 border-t border-slate-800/60 pt-10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users size={24} className="text-red-500" />
              Hlavní obsazení
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movie.credits.cast.slice(0, 6).map((actor: any) => (
                <div key={actor.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors group">
                  {actor.profile_path ? (
                    <div className="overflow-hidden aspect-[3/4]">
                      <img 
                        src={`https://image.tmdb.org/t/p/w276_and_h350_face${actor.profile_path}`} 
                        alt={actor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[3/4] bg-slate-800 flex items-center justify-center">
                      <Users size={32} className="text-slate-600" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="font-bold text-white text-sm truncate">{actor.name}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">{actor.character}</div>
                  </div>
                </div>
              ))}
            </div>
          </AnimateFadeIn>
        )}

        {/* --- SEKCE: DISKUZE --- */}
        <div className="mt-16">
          <Discussion mediaId={resolvedParams.id} mediaType="movie" />
        </div>

      </div>
    </div>
  );
}