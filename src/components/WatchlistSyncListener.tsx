"use client";

import { useWatchlistSync } from "@/hooks/useWatchlistSync";

export default function WatchlistSyncListener() {
  useWatchlistSync();
  return null; // Nic nevykresluje, jen tiše hlídá auth stav v prohlížeči
}