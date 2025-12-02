// site/src/hooks/sa.js
import { useEffect, useState } from "react";
import { getSA } from "../lib/sa";

/**
 * React hook to get the global SA helper once it's ready.
 *
 * - Prefers the classic window.SA helper (from public/sa.js)
 * - Also waits for window.sa.ready (compat bridge from lib/sa.js)
 */
export function useSA() {
  const [sa, setSa] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // If the compat bridge exists, let it initialize first
        if (window.sa?.ready) {
          try {
            await window.sa.ready();
          } catch {
            // non-fatal; we still try to grab SA below
          }
        }

        const helper =
          window.SA ||
          (await getSA().catch(() => window.SA || null)) ||
          null;

        if (alive) setSa(helper);
      } catch {
        if (alive) setSa(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return sa;
}

export function useSignedIn() {
  const sa = useSA();
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (!sa) return;

    const update = () => setSigned(Boolean(sa?.isSignedIn?.()));
    update();

    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [sa]);

  return signed;
}

export function useRole() {
  const sa = useSA();
  const [role, setRole] = useState("FAN");

  useEffect(() => {
    if (!sa) return;

    const update = () => setRole(sa?.getRole?.() || "FAN");
    update();

    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [sa]);

  return role;
}

