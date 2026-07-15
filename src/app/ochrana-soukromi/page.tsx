"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// Definice animací pro postupné načítání (stagger effect)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Časový rozestup mezi animacemi jednotlivých prvků
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    } as const,
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 py-16 sm:py-24">
      {/* Hlavní kontejner */}
      <motion.div 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Zpět domů */}
        <motion.div variants={itemVariants}>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Zpět na úvodní stránku
          </Link>
        </motion.div>

        {/* Hlavička na celou šířku */}
        <motion.div variants={itemVariants} className="border-b border-slate-900 pb-8 mb-12">
          <div className="flex items-center gap-3 text-red-500 mb-3">
            <ShieldCheck size={32} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Právní informace</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
            Ochrana osobních údajů
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            CineVibe &bull; Poslední aktualizace: 15. července 2026
          </p>
        </motion.div>

        {/* GRID ROZLOŽENÍ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEVÝ SLOUPEC: Rychlá navigace */}
          <motion.aside 
            variants={itemVariants}
            className="lg:col-span-4 lg:sticky lg:top-28 space-y-6"
          >
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <FileText size={14} className="text-red-500" />
                Obsah stránky
              </h3>
              <nav className="space-y-1">
                {[
                  { id: "udaje", label: "1. Jaké údaje sbíráme" },
                  { id: "ucel", label: "2. Proč data zpracováváme" },
                  { id: "uloziste", label: "3. Kde data uchováváme" },
                  { id: "prava", label: "4. Vaše práva a smazání" },
                  { id: "kontakt", label: "5. Kontaktní údaje" },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center justify-between text-sm text-slate-400 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-900/50 transition-all group"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                  </a>
                ))}
              </nav>
            </div>

            {/* Rychlé shrnutí */}
            <div className="hidden lg:block bg-red-600/5 border border-red-500/10 rounded-2xl p-6">
              <span className="text-red-400 text-xs font-black uppercase tracking-widest mb-2 block">CineVibe slib 🍿</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tvoje data jsou u nás v bezpečí. Nejsme firma, nikoho nespamujeme a data nikomu neprodáváme. Účet můžeš kdykoliv kompletně smazat jedním kliknutím.
              </p>
            </div>
          </motion.aside>

          {/* PRAVÝ SLOUPEC: Text rozdělený na animované sekce */}
          <div className="lg:col-span-8 space-y-12 max-w-3xl">
            
            <motion.p variants={itemVariants} className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Vítá vás <strong>CineVibe</strong>. Vaše soukromí je pro nás nesmírně důležité. 
              Tento dokument srozumitelně vysvětluje, jaké údaje o vás shromažďujeme, 
              proč to děláme a jak je chráníme. Naším cílem je být maximálně transparentní.
            </motion.p>

            <motion.blockquote variants={itemVariants} className="border-l-2 border-red-500 bg-red-500/5 px-5 py-4 rounded-r-2xl text-sm text-slate-300 leading-relaxed">
              <strong>Stručně řečeno:</strong> Nejsme žádný korporát. CineVibe je nekomerční fanouškovský projekt. Vaše data nikomu neprodáváme, neposkytujeme třetím stranám a používáme je výhradně k tomu, aby vám web správně fungoval.
            </motion.blockquote>

            {/* Sekce 1 */}
            <motion.section id="udaje" variants={itemVariants} className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-black text-white tracking-tight">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/10 text-red-500 text-sm font-bold">1</span>
                Jaké údaje shromažďujeme?
              </h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Abyste mohli naplno využívat všechny funkce CineVibe (jako jsou komentáře, watchlisty a párování v Match), musíte se zaregistrovat. Při registraci ukládáme:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>E-mailovou adresu:</strong> Slouží výhradně pro vaše bezpečné přihlášení a obnovu hesla.</li>
                  <li><strong>Uživatelské jméno (přezdívku):</strong> Zobrazuje se u vašich komentářů.</li>
                  <li><strong>Vaše interakce:</strong> Seznamy uložených filmů (watchlisty), vaše hodnocení a komentáře, které na webu napíšete.</li>
                </ul>
              </div>
            </motion.section>

            {/* Sekce 2 */}
            <motion.section id="ucel" variants={itemVariants} className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-black text-white tracking-tight">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/10 text-red-500 text-sm font-bold">2</span>
                Proč data zpracováváme?
              </h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Právním základem pro zpracování je nezbytnost pro splnění „smlouvy“ o poskytování služby (tedy provozování vašeho uživatelského účtu). Data zpracováváme pro:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Vytvoření a správu vašeho uživatelského profilu.</li>
                  <li>Ukládání vašich filmových preferencí, abyste o ně nepřišli při zavření prohlížeče.</li>
                  <li>Zobrazení vašich komentářů pod filmy a seriály.</li>
                  <li>Zajištění bezpečnosti webu (např. ochrana před spamem v komentářích).</li>
                </ul>
              </div>
            </motion.section>

            {/* Sekce 3 */}
            <motion.section id="uloziste" variants={itemVariants} className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-black text-white tracking-tight">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/10 text-red-500 text-sm font-bold">3</span>
                Kde jsou data uložena?
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Pro provoz databáze a autentizaci využíváme službu <strong>Supabase</strong>. 
                Data jsou uložena v zabezpečených cloudových centrech v rámci Evropské unie (Frankfurt, Německo), 
                čímž je zajištěn plný soulad s evropskými standardy GDPR.
              </p>
            </motion.section>

            {/* Sekce 4 */}
            <motion.section id="prava" variants={itemVariants} className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-black text-white tracking-tight">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/10 text-red-500 text-sm font-bold">4</span>
                Vaše práva a smazání účtu
              </h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Podle legislativy GDPR máte plnou kontrolu nad svými údaji. Máte právo na:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Přístup k vašim uloženým údajům.</li>
                  <li>Opravu nepřesných nebo neaktuálních údajů.</li>
                  <li><strong>Právo na zapomnění (smazání):</strong> Kdykoliv se můžete rozhodnout svůj účet zrušit. Na vaši žádost okamžitě smažeme váš účet, vaše watchlisty i veškeré vaše komentáře z naší databezpečné databáze.</li>
                </ul>
                <p className="text-sm">
                  Pokud si přejete smazat svá data, napište nám na kontaktní e-mail uvedený níže a my se o to obratem postaráme.
                </p>
              </div>
            </motion.section>

            {/* Sekce 5 (Kontakt)
            <motion.section id="kontakt" variants={itemVariants} className="pt-4 scroll-mt-24">
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 sm:p-8 space-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Zůstaňme v kontaktu
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Máte jakékoliv otázky ohledně ochrany soukromí, zabezpečení nebo chcete rovnou požádat o smazání účtu? Neváhejte nám napsat:
                </p>
                <div className="text-sm font-semibold text-white pt-2">
                  E-mail: <a href="mailto:info@cinevibe.cz" className="text-red-500 hover:underline">info@cinevibe.cz</a>
                </div>
              </div>
            </motion.section>
            */}

          </div>

        </div>

      </motion.div>
    </div>
  );
}