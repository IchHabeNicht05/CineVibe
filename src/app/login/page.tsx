// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Film, LogIn, UserPlus, User } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // NOVÝ STAV: Uživatelské jméno
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username.trim()) {
          throw new Error("Prosím, vyplňte uživatelské jméno.");
        }

        // 1. KONTROLA DUPLICITY JMÉNA
        const checkRes = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.trim())}`);
        const checkData = await checkRes.json();
        
        if (!checkRes.ok) throw new Error("Nepodařilo se ověřit uživatelské jméno.");
        if (checkData.exists) {
          throw new Error("Toto uživatelské jméno už používá někdo jiný. Zvolte prosím jiné.");
        }

        // 2. REGISTRACE
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        // 3. ODCHYCENÍ CHYB (včetně duplicitního e-mailu)
        if (signUpError) {
          // Supabase vrací specifickou chybu, pokud e-mail už existuje
          if (signUpError.message.includes("already registered") || signUpError.status === 422) {
            throw new Error("Tento e-mail už je zaregistrovaný. Přepněte na přihlášení.");
          }
          throw signUpError;
        }
        
        // 4. AUTOMATICKÉ PŘIHLÁŠENÍ A PŘESMĚROVÁNÍ
        // Pokud je vypnuté ověřování e-mailu v Supabase, `data.session` se ihned vytvoří
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          // Pojistka, kdyby bylo náhodou zapnuté potvrzování e-mailu linkem
          alert("Účet byl úspěšně vytvořen! Zkontrolujte svůj e-mail.");
          setIsRegistering(false);
          setUsername("");
        }

      } else {
        // --- KLASICKÉ PŘIHLÁŠENÍ ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Špatný e-mail nebo heslo.");
          }
          throw signInError;
        }

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Něco se nepodařilo. Zkontrolujte údaje.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/60">
        
        {/* LOGO */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Film className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            CineVibe <span className="text-red-500">Auth</span>
          </h1>
          <p className="text-sm text-slate-400">
            {isRegistering ? "Vytvoř si účet a zapoj se do diskuzí" : "Přihlas se ke svému filmovému světu"}
          </p>
        </div>

        {/* FORMULÁŘ */}
        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          {/* DYNAMICKÉ POLE: Uživatelské jméno (Zobrazí se pouze při registraci s plynulým přechodem) */}
          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Uživatelské jméno</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isRegistering}
                  placeholder="FilmovýFanatik"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tvuj@email.cz"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              "Chviličku..."
            ) : (
              <>
                {isRegistering ? <UserPlus size={16} /> : <LogIn size={16} />}
                {isRegistering ? "Zaregistrovat se" : "Přihlásit se"}
              </>
            )}
          </button>
        </form>

        {/* PŘEPÍNAČ MEZI LOGIN / REGISTRACÍ */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegistering ? (
            <p>
              Už máš účet?{" "}
              <button 
                type="button" 
                onClick={() => { setIsRegistering(false); setError(""); }} 
                className="text-red-500 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Přihlas se
              </button>
            </p>
          ) : (
            <p>
              Nemáš ještě účet?{" "}
              <button 
                type="button" 
                onClick={() => { setIsRegistering(true); setError(""); }} 
                className="text-red-500 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Zaregistruj se
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}