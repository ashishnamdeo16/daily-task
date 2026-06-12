"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  // PWA is disabled in `next dev`; production build registers the worker automatically.
  if (process.env.NODE_ENV === "development") return null;

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "unsupported" | "denied">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    void (async () => {
      const reg = await getServiceWorkerRegistration();
      if (!reg) return;

      const sub = await reg.pushManager.getSubscription();
      if (sub) setStatus("subscribed");
    })();
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return { ok: false as const, error: "Push notifications are not supported in this browser." };
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!vapidKey) {
      return { ok: false as const, error: "VAPID public key is not configured." };
    }

    setStatus("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return { ok: false as const, error: "Notification permission denied." };
      }

      const reg = await getServiceWorkerRegistration();
      if (!reg) {
        setStatus("idle");
        return {
          ok: false as const,
          error:
            process.env.NODE_ENV === "development"
              ? "Push needs a production build. Run `pnpm build && pnpm start`, or test on your deployed Vercel URL."
              : "Service worker is not available. Install the PWA from your browser menu and try again.",
        };
      }

      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("idle");
        return { ok: false as const, error: data.error ?? "Failed to save subscription." };
      }

      setStatus("subscribed");
      return { ok: true as const };
    } catch (err) {
      setStatus("idle");
      return { ok: false as const, error: err instanceof Error ? err.message : "Subscription failed." };
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await getServiceWorkerRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await fetch("/api/push/subscribe", { method: "DELETE" });
      setStatus("idle");
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Unsubscribe failed." };
    }
  }, []);

  return { status, subscribe, unsubscribe };
}
