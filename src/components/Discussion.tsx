/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, memo } from "react";
import { MessageSquare, Send, User, MessageCircleWarning, Lock, Trash2, Loader2 } from "lucide-react"; // Pokud nemáte Radix, klidně nechte Lucide:
import { MessageSquare as MsgIcon, Send as SendIcon, User as UserIcon, MessageCircleWarning as WarnIcon, Lock as LockIcon, Trash2 as TrashIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// 1. ROZŠÍŘENÉ ROZHRANÍ KOMENTÁŘE
interface Comment {
  id: string;
  username: string;
  text: string;
  createdAt: string;
  userId?: string; // Přidáno pro ověření vlastnictví při mazání
}

interface DiscussionProps {
  mediaId: string;
  mediaType: "movie" | "tv";
}

const COMMENTS_PER_PAGE = 10;

// HELPER PRO RELATIVNÍ ČAS (Čeština, optimalizovaný výkon)
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  // Bezpečnostní pojistka pro budoucí časy (či mírný desynchronizovaný čas na klientu)
  if (diffSec < 15) return "před chvílí";

  const rtf = new Intl.RelativeTimeFormat("cs", { numeric: "always" });

  if (diffSec < 60) return rtf.format(-diffSec, "second");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHr < 24) return rtf.format(-diffHr, "hour");
  if (diffDays < 7) return rtf.format(-diffDays, "day");

  // Pokud je to starší než týden, ukážeme klasické datum
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// 2. SKELETON PRO FILTRACI LAYOUT SHIFTU
function CommentSkeleton() {
  return (
    <div className="w-full bg-slate-900/10 border border-slate-800/30 rounded-2xl p-5 flex gap-4 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// 3. MEMOIZOVANÁ KARTA KOMENTÁŘE (Zabraňuje zbytečnému překreslování dlouhých seznamů)
const CommentItem = memo(({ 
  comment, 
  currentUserId, 
  currentUsername,
  onDelete, 
  isDeleting 
}: { 
  comment: Comment; 
  currentUserId?: string;
  currentUsername?: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  // Ověření vlastnictví (podle userId, případně fallback na username)
  const isOwner = (currentUserId && comment.userId === currentUserId) || 
                  (currentUsername && comment.username === currentUsername);
  
  const isOptimistic = String(comment.id).startsWith("temp-");

  return (
    <div 
      className={`w-full bg-slate-900/30 border border-slate-800/40 rounded-2xl p-5 flex gap-4 transition-all hover:bg-slate-900/50 hover:border-slate-800/80 ${
        isOptimistic ? "opacity-60 border-dashed border-red-500/30" : ""
      }`}
    >
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-slate-300 font-bold shadow-inner shrink-0 uppercase select-none">
        {comment.username ? comment.username.substring(0, 1) : <UserIcon size={18} />}
      </div>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-bold text-white text-sm sm:text-base truncate">
              {comment.username}
            </span>
            <span className="text-xs text-slate-500 shrink-0">
              {getRelativeTime(comment.createdAt)}
            </span>
            {isOptimistic && (
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
                Odesílám...
              </span>
            )}
          </div>

          {/* TLAČÍTKO PRO MAZÁNÍ (Zobrazí se pouze autorovi) */}
          {isOwner && !isOptimistic && (
            <button
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              title="Smazat komentář"
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin h-3.5 w-3.5" />
              ) : (
                <TrashIcon size={15} />
              )}
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
    </div>
  );
});
CommentItem.displayName = "CommentItem";

export default function Discussion({ mediaId, mediaType }: DiscussionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  
  // STRÁNKOVÁNÍ (PAGINATION)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // SPAM OCHRANA (COOLDOWN COUTNDOWN)
  const [cooldown, setCooldown] = useState(0);

  // MAZÁNÍ KOMENTÁŘŮ
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // STAV PRO PŘIHLÁŠENÉHO UŽIVATELE
  const [user, setUser] = useState<any>(null);
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || "Uživatel";

  // 1. Zjištění session a prvotní načtení komentářů
  useEffect(() => {
    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Načtení komentářů (včetně podpory pro stránkování)
  useEffect(() => {
    async function loadInitialComments() {
      setFetching(true);
      try {
        const res = await fetch(`/api/comments?mediaId=${mediaId}&mediaType=${mediaType}&limit=${COMMENTS_PER_PAGE}&page=1`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        setComments(data);
        // Pokud server vrátil méně komentářů než limit, už další nejsou
        if (data.length < COMMENTS_PER_PAGE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Nepodařilo se načíst komentáře:", err);
      } finally {
        setFetching(false);
      }
    }

    loadInitialComments();
    // Reset stránkování při změně filmu/seriálu
    setPage(1);
    setHasMore(true);
  }, [mediaId, mediaType]);

  // 2. NAČTENÍ DALŠÍ STRÁNKY
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(`/api/comments?mediaId=${mediaId}&mediaType=${mediaType}&limit=${COMMENTS_PER_PAGE}&page=${nextPage}`);
      if (!res.ok) throw new Error();
      const newData = await res.json();

      if (newData.length < COMMENTS_PER_PAGE) {
        setHasMore(false);
      }

      setComments((prev) => {
        // Sloučení a odstranění případných duplicit (např. pokud se mezitím přidal nový)
        const combined = [...prev, ...newData];
        const unique = combined.filter(
          (char, index, self) => self.findIndex((t) => t.id === char.id) === index
        );
        return unique;
      });
      setPage(nextPage);
    } catch (err) {
      console.error("Nepodařilo se načíst další komentáře:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // 3. ODPOČET COOLDOWNU PROTI SPAMU
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // 4. OPTIMISTICKÉ ODESLÁNÍ KOMENTÁŘE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || cooldown > 0) return;

    const originalText = text;
    const tempId = `temp-${Date.now()}`;
    
    // Vytvoření dočasného optimistického komentáře
    const tempComment: Comment = {
      id: tempId,
      username: displayName,
      text: originalText,
      createdAt: new Date().toISOString(),
      userId: user.id
    };

    // Okamžité přidání do UI (bude mít sníženou průhlednost a popisek "Odesílám...")
    setComments((prev) => [tempComment, ...prev]);
    setText("");
    setError("");
    setCooldown(10); // Nastavení cooldownu na 10 vteřin

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          mediaId, 
          mediaType, 
          username: displayName, 
          text: originalText 
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Nepodařilo se odeslat");
      }

      const realComment = await res.json();

      // Nahrazení dočasného komentáře skutečným z DB (získá reálné ID a čas)
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...realComment, userId: user.id } : c))
      );
    } catch (err: any) {
      // ROLLBACK: Pokud odeslání selže, odebereme komentář a vrátíme text do pole
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setText(originalText);
      setError(err.message || "Něco se pokazilo, zkus to prosím znovu.");
      setCooldown(0); // Zrušíme cooldown, pokud odeslání selhalo
    }
  };

  // 5. MAZÁNÍ VLASTNÍHO KOMENTÁŘE (S optimistickým smazáním)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Opravdu chceš smazat svůj komentář?")) return;

    setDeletingId(commentId);
    setError("");
    
    const backupComments = [...comments];
    // Optimistický rollback v UI
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Voláme API na smazání (Očekává DELETE požadavek s ID komentáře v query nebo těle)
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });

      if (!res.ok) {
        throw new Error("Komentář se nepodařilo smazat na serveru.");
      }
    } catch (err: any) {
      // Pokud mazání na serveru selhalo, vrátíme smazaný komentář zpět
      setComments(backupComments);
      setError(err.message || "Chyba při mazání komentáře.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-8">
      
      {/* NADPIS DISKUZE */}
      <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
        <MsgIcon className="text-red-500 h-7 w-7" />
        <h2 className="text-2xl font-black text-white tracking-tight">
          Diskuze a názory diváků <span className="text-slate-500 font-normal">({comments.length})</span>
        </h2>
      </div>

      {/* PODMÍNĚNÝ FORMULÁŘ */}
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
                <WarnIcon size={16} />
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
                disabled={cooldown > 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all resize-none leading-relaxed disabled:opacity-50"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={cooldown > 0 || !text.trim()}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <SendIcon size={16} />
                {cooldown > 0 ? `Spam ochrana (${cooldown}s)` : "Publikovat"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VÝZVA K PŘIHLÁŠENÍ */
        <div className="w-full bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 text-center shadow-inner">
          <LockIcon size={28} className="text-slate-600 mx-auto mb-3" />
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

      {/* SEZNAM KOMENTÁŘŮ S PODPOROU SKELETONŮ */}
      <div className="w-full space-y-4">
        {fetching ? (
          // Generování 3 pulzujících skeleton karet během načítání
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <CommentSkeleton key={index} />
            ))}
          </div>
        ) : comments.length > 0 ? (
          <>
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  currentUserId={user?.id}
                  currentUsername={displayName}
                  onDelete={handleDeleteComment}
                  isDeleting={deletingId === comment.id}
                />
              ))}
            </div>

            {/* TLAČÍTKO PRO STRÁNKOVÁNÍ */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-6 py-3 rounded-xl text-xs font-bold transition-all border border-slate-800 hover:border-slate-700 active:scale-95 duration-200 cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 text-red-500" />
                      Načítám další...
                    </>
                  ) : (
                    "Načíst další komentáře"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* PRÁZDNÝ STAV */
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <MsgIcon size={32} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Zatím zde nejsou žádné komentáře. Buď první!</p>
          </div>
        )}
      </div>

    </div>
  );
}