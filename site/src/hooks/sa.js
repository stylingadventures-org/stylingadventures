import { useEffect, useState } from "react";
import { getSA } from "../lib/sa";

/**
 * React hook to get the global SA helper once it's ready.
 */
export function useSA() {
  const [sa, setSa] = useState(null);

  useEffect(() => {
    let ok = true;

    (async () => {
      try {
        const s =
          window.SA ||
          (await getSA().catch(() => window.SA || null)) ||
          null;
        if (ok) setSa(s);
      } catch {
        if (ok) setSa(null);
      }
    })();

    return () => {
      ok = false;
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

