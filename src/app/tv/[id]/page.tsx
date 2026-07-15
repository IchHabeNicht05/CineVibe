/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/tv/[id]/page.tsx
import { notFound } from "next/navigation";
import { Star, Calendar, MonitorPlay, Users, Play, Info, Tv, Globe, Building2 } from "lucide-react";
// Importujeme existující animační wrappery z detailu filmu
import { AnimateFadeIn, StaggerContainer, StaggerItem } from "../../film/[id]/AnimationWrappers";
import Discussion from "@/components/Discussion";

async function getTvShowDetails(id: string) {
  if (!process.env.TMDB_API_KEY) {
    return { error: "Chybí API klíč" };
  }

  const url = `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.TMDB_API_KEY}&language=cs-CZ&append_to_response=credits,videos`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { error: `Chyba API: ${res.status}` };
    return res.json();
  } catch (err) {
    return { error: "Nepodařilo se připojit k TMDB" };
  }
}

async function getWatchProviders(id: string) {
  if (!process.env.TMDB_API_KEY) return null;
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}/watch/providers?api_key=${process.env.TMDB_API_KEY}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.CZ || null;
}

function getLocalProviderLogo(providerId: number): string | null {
  switch (providerId) {
    case 8: return "/logos/netflix.webp"; 
    case 1899: case 384: return "/logos/hbo.png";
    case 337: return "/logos/disney.webp";
    case 1773: return "/logos/skyshowtime.png";
    case 119: return "/logos/prime.webp";
    case 350: return "/logos/apple.jpg";
    default: return null;
  }
}

export default async function TvShowPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const [show, providers] = await Promise.all([
    getTvShowDetails(resolvedParams.id),
    getWatchProviders(resolvedParams.id)
  ]);

  if (show?.error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-xl max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Jejda, něco se pokazilo</h2>
          <p>{show.error}</p>
        </div>
      </div>
    );
  }

  if (!show || !show.id) {
    notFound();
  }

  const streamingServices = providers?.flatrate || [];
  const trailer = show.videos?.results?.find(
    (vid: any) => vid.site === "YouTube" && vid.type === "Trailer"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 pb-20 overflow-x-hidden">
      
      {/* --- HERO SEKCE S BACKDROP OBRÁZKEM (Animace a object-top) --- */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-slate-900 overflow-hidden">
        {show.backdrop_path ? (
          <AnimateFadeIn type="image" className="absolute inset-0 w-full h-full">
            <img
              src={`https://image.tmdb.org/t/p/original${show.backdrop_path}`}
              alt={show.name}
              className="w-full h-full object-cover object-top opacity-25 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          </AnimateFadeIn>
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
      </div>

      {/* --- HLAVNÍ OBSAH (Postupné načítání prvků) --- */}
      <div className="max-w-6xl mx-auto px-6 relative -mt-32 md:-mt-48 z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          
          {/* Levý sloupec: Plakát */}
          <AnimateFadeIn delay={0.2} className="w-48 md:w-1/3 flex-shrink-0 mx-auto md:mx-0">
            {show.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                alt={show.name}
                className="w-full rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-slate-800/80"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-slate-800 rounded-2xl flex items-center justify-center ring-1 ring-slate-700">
                <MonitorPlay size={48} className="text-slate-600" />
              </div>
            )}
          </AnimateFadeIn>
          
          {/* Pravý sloupec: Informace s kaskádovým efektem */}
          <StaggerContainer className="w-full md:w-2/3 flex flex-col justify-end pt-4 md:pt-16">
            
            <StaggerItem>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                {show.name}
              </h1>
            </StaggerItem>
            
            {/* Rychlá fakta */}
            <StaggerItem>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-6">
                {show.first_air_date && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar size={16} className="text-red-500" />
                    {show.first_air_date.substring(0, 4)}
                  </div>
                )}
                
                {show.vote_average > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star size={16} className="fill-amber-400" />
                    {show.vote_average.toFixed(1)} <span className="text-slate-500">({show.vote_count})</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-300">
                  <MonitorPlay size={16} className="text-red-500" />
                  {show.number_of_seasons} {show.number_of_seasons === 1 ? 'Série' : (show.number_of_seasons >= 2 && show.number_of_seasons <= 4) ? 'Série' : 'Sérií'} 
                  <span className="text-slate-500">({show.number_of_episodes} epizod)</span>
                </div>

                <div className="px-2 py-0.5 rounded bg-slate-800/80 text-xs uppercase tracking-wider border border-slate-700">
                  {show.status === "Ended" ? "Ukončeno" : show.status === "Returning Series" ? "Vysílá se" : show.status}
                </div>
              </div>
            </StaggerItem>

            {/* Žánry */}
            {show.genres && show.genres.length > 0 && (
              <StaggerItem>
                <div className="flex flex-wrap gap-2 mb-6">
                  {show.genres.map((genre: any) => (
                    <span key={genre.id} className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-sm font-semibold">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </StaggerItem>
            )}

            {/* Popis */}
            <StaggerItem>
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Info size={20} className="text-red-500" />
                  O seriálu
                </h3>
                <p className="text-lg leading-relaxed text-slate-300/90 text-balance md:text-left">
                  {show.overview || "Popis zatím není k dispozici."}
                </p>
              </div>
            </StaggerItem>

            {/* Akční tlačítko (Trailer) */}
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
          
          {/* LEVÁ STRANA: Kde sledovat */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MonitorPlay size={24} className="text-red-500" />
              Kde sledovat v ČR
              <span className="text-xs font-normal text-slate-500 ml-2">(v předplatném)</span>
            </h3>
            
            {streamingServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {streamingServices.map((service: any) => {
                  const localLogo = getLocalProviderLogo(service.provider_id);
                  const logoSrc = localLogo || `https://image.tmdb.org/t/p/w154${service.logo_path}`;
                  
                  return (
                    <div 
                      key={service.provider_id} 
                      className="group relative flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3 pr-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-800"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg shadow-md">
                        <img 
                          src={logoSrc} 
                          alt={service.provider_name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{service.provider_name}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                          Dostupné ihned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-400 text-sm">
                Tento seriál momentálně v ČR na žádné streamovací platformě v rámci předplatného neběží.
              </div>
            )}
          </div>

          {/* PRAVÁ STRANA: Podrobné detaily */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Info size={24} className="text-red-500" />
              Detaily o seriálu
            </h3>
            
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
                <span className="text-slate-400 font-medium flex items-center gap-2"><Globe size={16} /> Typ seriálu</span>
                <span className="text-slate-200 font-semibold">{show.type || "Neznámý"}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
                <span className="text-slate-400 font-medium flex items-center gap-2"><Tv size={16} /> Vysílací stanice</span>
                <div className="flex gap-2">
                  {show.networks && show.networks.length > 0 ? (
                    show.networks.map((network: any) => (
                        <span key={network.id} className="text-white font-semibold">{network.name}</span>
                    ))
                  ) : (
                    <span className="text-slate-500">Neznámá</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <span className="text-slate-400 font-medium flex items-center gap-2"><Building2 size={16} /> Produkční společnosti</span>
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  {show.production_companies && show.production_companies.length > 0 ? (
                    Array.from(new Set(show.production_companies.map((c: any) => c.name))).map((companyName: any, index: number) => (
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
        {show.credits?.cast && show.credits.cast.length > 0 && (
          <AnimateFadeIn delay={0.5} className="mt-16 border-t border-slate-800/60 pt-10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users size={24} className="text-red-500" />
              Hlavní obsazení
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {show.credits.cast.slice(0, 6).map((actor: any) => (
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

        {/* --- SEKCE: NOVÁ FULL-WIDTH DISKUZE PRO SERIÁLY --- */}
        <div className="mt-16">
          <Discussion mediaId={resolvedParams.id} mediaType="tv" />
        </div>

      </div>
    </div>
  );
}