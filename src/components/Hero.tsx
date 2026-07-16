"use client";

import { Movie } from "@/types";
import { motion } from "framer-motion";
import { Tv, Bookmark, Dices, Heart, ChevronDown } from "lucide-react";

interface HeroProps {
  movies?: Movie[];
}

export default function Hero({ movies = [] }: HeroProps) {
  const bgMovies = movies.slice(0, 18);

  // Hlavní kontejner pro postupné animování textů a karet
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12, // Rychlejší a plynulejší rozestup
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }, 
    },
  };

  // Definice 4 hlavních pilířů webu (včetně rande / swipe)
  const features = [
    {
      icon: Tv,
      title: "Kde to streamovat?",
      desc: "Okamžitý přehled, zda film běží na Netflixu, Maxu, Disney+ nebo jinde v ČR.",
      color: "text-red-500",
    },
    {
      icon: Heart,
      title: "Filmové rande (Swipe)",
      desc: "Vyberte si film ve dvou stylem Tinderu. Jakmile oba hodíte swipe doprava, máte shodu!",
      color: "text-rose-500 animate-pulse", // jemný puls pro přilákání pozornosti
    },
    {
      icon: Bookmark,
      title: "Ukládání bez registrace",
      desc: "Vytvoř si svůj osobní watchlist ihned. Žádné e-maily, data zůstávají u tebe.",
      color: "text-blue-500",
    },
    {
      icon: Dices,
      title: "Generátor výběru",
      desc: "Trpíš rozhodovací paralýzou? Nech osud vybrat ideální film jedním kliknutím.",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="relative w-full min-h-screen lg:h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-slate-950 py-20 lg:py-0">
      
      {/* --- POZADÍ: Koláž plakátů --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: 0.25, scale: 1.1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full"
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 p-2">
          {bgMovies.map((movie) => (
            <img
              key={movie.id}
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-auto object-cover rounded-md shadow-lg select-none"
            />
          ))}
        </div>
        
        {/* Překryvy pro temný filmový look */}
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/90 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950" />
      </motion.div>

      {/* --- HLAVNÍ OBSAH --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col items-center text-center mt-6"
      >
        
        {/* Odznáček nad nadpisem */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-4"
        >
          🍿 Tvůj filmový kompas
        </motion.div>

        {/* Název projektu */}
        <motion.h1 
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-2xl mb-2"
        >
          CineVibe
        </motion.h1>

        {/* Hlavní lákadlo */}
        <motion.h2 
          variants={itemVariants}
          className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg mb-8 max-w-2xl text-balance"
        >
          Najdi, co dneska sledovat. Bez zdlouhavého hledání.
        </motion.h2>

        {/* --- GRID HLAVNÍCH FUNKCÍ (včetně Swipe) --- */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-10 text-left"
        >
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index}
                className="group relative p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-800 ${feat.color} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base">{feat.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Akční tlačítko se spring fyzikou */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#ef4444", color: "#ffffff" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => window.scrollTo({ top: window.innerHeight - 80, behavior: "smooth" })}
            className="rounded-full bg-white px-10 py-4 text-sm sm:text-base font-extrabold text-black tracking-wide shadow-2xl shadow-red-600/10 flex items-center gap-2 group transition-all"
          >
            VSTOUPIT DO SVĚTA FILMŮ
            <ChevronDown size={18} className="animate-bounce group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
          
          <span className="text-[11px] text-slate-500 font-medium">
            Zcela zdarma • Bez nutnosti registrace • 🇨🇿 Plně v češtině
          </span>
        </motion.div>

      </motion.div>

    </div>
  );
}