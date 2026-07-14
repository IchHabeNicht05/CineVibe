"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registrován úspěšně:", reg.scope))
        .catch((err) => console.error("Registrace Service Workera selhala:", err));
    }
  }, []);

  return null;
}