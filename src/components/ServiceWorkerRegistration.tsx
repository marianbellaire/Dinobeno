"use client";

import { useEffect } from "react";

/** Registriert den Service Worker (public/sw.js) für Offline-Spielbarkeit (Phase 6). */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err: unknown) => {
      console.warn("Service-Worker-Registrierung fehlgeschlagen:", err);
    });
  }, []);

  return null;
}
