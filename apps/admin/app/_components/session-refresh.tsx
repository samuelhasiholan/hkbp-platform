"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function SessionRefresh() {
  const router = useRouter();

  useEffect(() => {
    let isRefreshing = false;

    async function refreshSession() {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        const response = await fetch("/api/auth/refresh", { method: "POST" });
        if (response.status === 401) {
          router.replace("/login");
          router.refresh();
        }
      } finally {
        isRefreshing = false;
      }
    }

    const interval = window.setInterval(refreshSession, REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    window.addEventListener("focus", refreshSession);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshSession);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [router]);

  return null;
}
