// src/components/Discussion.tsx
"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, User, MessageCircleWarning, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Comment {
  id: string;
  username: string;
  text: string;
  createdAt: string;
}

interface DiscussionProps {
  mediaId: string;
  mediaType: "movie" | "tv";
}

export default function Discussion({ mediaId, mediaType }: DiscussionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  
  // Stavy pro přihlášeného uživatele
  const [user, setUser] = useState<any>(null);
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || "Uživatel";

  // 1. Zjištění identity uživatele a načtení komentářů
  useEffect(() => {
    async function initDiscussion() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      try {
        const res = await fetch(`/api/comments?mediaId=${mediaId}&mediaType=${mediaType}`);
        if (!res.ok) throw new Error("Chyba při načítání");
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }

    initDiscussion();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [mediaId, mediaType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Získání čerstvého session tokenu pro bezpečné ověření na backendu
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Přidáme token do Authorization hlavičky, aby backend věděl, kdo přesně píše!
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        // Posíláme reálný displayName (přednostně username z metadat!)
        body: JSON.stringify({ 
          mediaId, 
          mediaType, 
          username: displayName, 
          text 
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Nepodařilo se odeslat");
      }

      const newComment = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setText("");
    } catch (err: any) {
      setError(err.message || "Něco se pokazilo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      
      {/* NADPIS DISKUZE */}
      <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
        <MessageSquare className="text-red-500 h-7 w-7" />
        <h2 className="text-2xl font-black text-white tracking-tight">
          Diskuze a názory diváků <span className="text-slate-500 font-normal">({comments.length})</span>
        </h2>
      </div>

      {/* PODMÍNĚNÝ FORMULÁŘ PRO PŘIDÁNÍ KOMENTÁRE */}
      {user ? (
        <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Přidej svůj názor jako: 
            </span>
            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
              {displayName}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-center gap-2">
                <MessageCircleWarning size={16} />
                {error}
              </div>
            )}

            <div className="relative">
              <textarea
                placeholder="Napiš, jak se ti to líbilo... (vyvaruj se spoilerů)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={1000}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={16} className={loading ? "animate-pulse" : ""} />
                {loading ? "Odesílám..." : "Publikovat"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VÝZVA K PŘIHLÁŠENÍ */
        <div className="w-full bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 text-center shadow-inner">
          <Lock size={28} className="text-slate-600 mx-auto mb-3" />
          <h4 className="text-white font-bold text-base mb-1">Chceš se zapojit do diskuze?</h4>
          <p className="text-slate-500 text-sm mb-4">Pro přidávání komentářů musíš mít vytvořený účet.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 active:scale-95"
          >
            Přihlásit se / Registrovat
          </Link>
        </div>
      )}

      {/* SEZNAM KOMENTÁŘŮ */}
      <div className="w-full space-y-4">
        {fetching ? (
          <div className="text-center py-8 text-slate-500 text-sm animate-pulse">
            Načítám diskuze...
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className="w-full bg-slate-900/30 border border-slate-800/40 rounded-2xl p-5 flex gap-4 transition-all hover:bg-slate-900/50 hover:border-slate-800"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-slate-300 font-bold shadow-inner shrink-0 uppercase select-none">
                {comment.username ? comment.username.substring(0, 1) : <User size={18} />}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white text-sm sm:text-base truncate">
                    {comment.username}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <MessageSquare size={32} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Zatím zde nejsou žádné komentáře. Buď první!</p>
          </div>
        )}
      </div>

    </div>
  );
}