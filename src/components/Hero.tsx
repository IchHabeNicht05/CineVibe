"use client";

import Link from "next/link";
import { Movie } from "@/types";
import { motion } from "framer-motion";

interface HeroProps {
  movies?: Movie[];
}

export default function Hero({ movies = [] }: HeroProps) {
  const bgMovies = movies.slice(0, 18);

  // Varianty pro postupné animování textů pod sebou
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Rozestup mezi animacemi dětí v sekundách
        delayChildren: 0.3,    // Zpoždění startu celé sekvence
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      // OPRAVA: Přidáno 'as const', aby TypeScript věděl, že jde přesně o 4 čísla
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }, 
    },
  };

  return (
    <div className="relative w-full h-[90vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      
      {/* --- POZADÍ: Koláž plakátů (Animovaný zoom a fade-in) --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: 0.3, scale: 1.1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full"
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 p-2 transform">
          {bgMovies.map((movie) => (
            <img
              key={movie.id}
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-auto object-cover rounded-md shadow-lg select-none"
            />
          ))}
        </div>
        
        {/* Překryvy pro filmový look */}
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/80 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950" />
      </motion.div>

      {/* --- HLAVNÍ OBSAH UPROSTŘED (Staggered animace) --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center mt-12"
      >
        
        {/* Název projektu */}
        <motion.h1 
          variants={itemVariants}
          className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-2xl mb-4"
        >
          CineVibe
        </motion.h1>

        {/* Hlavní lákadlo */}
        <motion.h2 
          variants={itemVariants}
          className="text-xl sm:text-2xl md:text-3xl font-semibold text-white drop-shadow-lg mb-2 max-w-3xl text-balance"
        >
          Hity z Netflixu, Max, Prime Video, Disney+ a dalších na jednom místě
        </motion.h2>
        
        {/* Popisek */}
        <motion.p 
          variants={itemVariants}
          className="text-sm sm:text-base text-slate-300/90 mb-8 max-w-xl mx-auto text-balance font-medium"
        >
          Objevuj trendy, novinky v kinech a prozkoumej kompletní nabídku těch nejlepších streamovacích platforem.
        </motion.p>

        {/* Akční tlačítko se spring fyzikou na hover/click */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#f1f5f9" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' })}
            className="rounded-full bg-white px-10 py-4 text-sm sm:text-base font-bold text-black tracking-wide shadow-2xl shadow-white/5"
          >
            ZAČÍT OBJEVOVAT
          </motion.button>
        </motion.div>

        {/* Drobný disclaimer pod čarou */}
        <motion.p 
          variants={itemVariants}
          className="mt-6 text-[10px] sm:text-xs text-slate-500 max-w-lg mx-auto text-balance"
        >
          *Dostupnost filmů se liší podle poskytovatele. Výsledky jsou závislé na aktuální nabídce platforem v ČR.
        </motion.p>
      </motion.div>

    </div>
  );
}