"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase"; // uprav cestu podle svého projektu

export function useWatchlistSync() {
  useEffect(() => {
    // Posloucháme změny přihlášení/odhlášení v Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === "SIGNED_IN" && session?.user) {
        const userId = session.user.id;
        const localWatchlistRaw = localStorage.getItem("cinevibe_watchlist");
        
        if (localWatchlistRaw) {
          try {
            const localMovies = JSON.parse(localWatchlistRaw);
            
            if (Array.isArray(localMovies) && localMovies.length > 0) {
              // Namapujeme lokální data na strukturu databáze
              const itemsToSync = localMovies.map((movieOrId) => {
                // Funguje, ať už máš v localStorage pole objektů {id: 123...} nebo jen ID [123, 456]
                const movieId = typeof movieOrId === "object" ? movieOrId.id : movieOrId;
                return {
                  user_id: userId,
                  movie_id: movieId,
                };
              });

              // .upsert vloží novinky a ignoruje/přepíše ty, které už v db existují
              const { error } = await supabase
                .from("watchlist")
                .upsert(itemsToSync, { onConflict: "user_id,movie_id" });

              if (!error) {
                console.log("Watchlist byl úspěšně synchronizován s databází. 🎉");
                // Po úspěšném uložení do DB smažeme lokální úložiště
                localStorage.removeItem("cinevibe_watchlist");
              } else {
                console.error("Chyba při synchronizaci watchlistu:", error.message);
              }
            }
          } catch (err) {
            console.error("Chyba při parsování lokálního watchlistu:", err);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}