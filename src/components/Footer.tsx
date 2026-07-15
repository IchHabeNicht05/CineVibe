import Link from "next/link";
import { Mail, Film, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-900 bg-[#0b1120]/80 backdrop-blur-md text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        
        {/* HORNÍ SEKCE (Grid) */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* 1. O projektu */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white font-black text-lg tracking-wider focus:outline-none mb-3">
              <span className="text-red-500">Cine</span>Vibe
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              Tvůj osobní filmový kompas. Objevuj nové filmy a seriály, swipej s přáteli 
              v reálném čase a vytvářej si vlastní filmové kolekce. Vše na jednom místě, 
              zcela zdarma a bez otravných reklam.
            </p>
          </div>

          {/* 2. Rychlé odkazy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4">Navigace</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-red-500 transition-colors">Domů</Link>
              </li>
              <li>
                <Link href="/filmy" className="hover:text-red-500 transition-colors">Filmy</Link>
              </li>
              <li>
                <Link href="/serialy" className="hover:text-red-500 transition-colors">Seriály</Link>
              </li>
              <li>
                <Link href="/kolekce" className="hover:text-red-500 transition-colors">Kolekce</Link>
              </li>
              <li>
                <Link href="/ochrana-soukromi" className="hover:text-red-500 transition-colors text-slate-500">
                  Ochrana soukromí (GDPR)
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. TMDB Atribuce (Povinné ze zákona/podmínek TMDB) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-1">Data & API</h4>
            {/* Oficiální TMDB Logo */}
            <div className="flex items-center gap-1.5 font-bold text-xs select-none">
                <span className="text-[#01b4e4] tracking-wider uppercase font-black">The Movie</span>
                <span className="bg-gradient-to-r from-[#c0fecf] to-[#1ad491] text-[#081c24] px-1.5 py-0.5 rounded text-[10px] font-black">DB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Tento produkt využívá TMDB API, ale není schválen ani certifikován službou TMDB.
            </p>
          </div>

        </div>

        {/* PROSTŘEDNÍ DĚLÍCÍ ČÁRA */}
        <hr className="my-8 border-slate-900" />

        {/* SPODNÍ SEKCE (Sociální sítě & Copyright) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs">
          
          {/* Copyright */}
          <div>
            <p>© 2026 CineVibe. Všechna práva vyhrazena.</p>
            <p className="text-slate-600 mt-0.5">Vytvořeno s láskou k filmu 🍿</p>
          </div>

          {/* Ikony / Odkazy na tebe
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/tvuj-github" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-lg bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-white hover:border-slate-800 transition-all cursor-pointer"
              title="GitHub projektu"
            >
            </a>
            <a 
              href="mailto:tvuj@email.cz" 
              className="p-2 rounded-lg bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-white hover:border-slate-800 transition-all cursor-pointer"
              title="Napiš mi e-mail"
            >
              <Mail size={16} />
            </a>
          </div>
          */}

        </div>

      </div>
    </footer>
  );
}