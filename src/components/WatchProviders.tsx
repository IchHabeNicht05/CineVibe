import Image from "next/image";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface WatchProvidersProps {
  id: string;
  type: "movie" | "tv";
}

// Tvoje definice lokálních log pro hezčí design
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

async function getWatchProvidersData(id: string, type: "movie" | "tv") {
  if (!process.env.TMDB_API_KEY) return null;
  const url = `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${process.env.TMDB_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.CZ || null;
  } catch (err) {
    console.error("Chyba při načítání poskytovatelů:", err);
    return null;
  }
}

export default async function WatchProviders({ id, type }: WatchProvidersProps) {
  const czData = await getWatchProvidersData(id, type);

  if (!czData) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-400 text-sm">
        Poskytovatelé streamování nejsou momentálně k dispozici.
      </div>
    );
  }

  const streamingServices: Provider[] = czData.flatrate || [];
  const justWatchLink: string = czData.link || "";

  if (streamingServices.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-400 text-sm flex flex-col items-start gap-2">
        <span>Tento {type === "movie" ? "film" : "seriál"} momentálně v ČR na žádné streamovací platformě v rámci předplatného neběží.</span>
        {justWatchLink && (
          <a 
            href={justWatchLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
          >
            Ověřit možnosti koupě/půjčení na JustWatch →
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {streamingServices.map((service) => {
          const localLogo = getLocalProviderLogo(service.provider_id);
          const logoSrc = localLogo || `https://image.tmdb.org/t/p/w154${service.logo_path}`;
          
          return (
            <a 
              key={service.provider_id} 
              href={justWatchLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3 pr-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-800"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-lg shadow-md bg-slate-950">
                <img 
                  src={logoSrc} 
                  alt={service.provider_name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-white">{service.provider_name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Dostupné ihned
                </span>
              </div>
            </a>
          );
        })}
      </div>
      
      {/* Splnění právních podmínek TMDB a JustWatch */}
      <div className="mt-3 text-[10px] text-slate-500 text-right">
        Data poskytuje{" "}
        <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-400 transition-colors">
          JustWatch
        </a>
      </div>
    </div>
  );
}