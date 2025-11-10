import { useEffect, useState } from "react";

export function useSA() {
  const [sa, setSa] = useState(null);
  useEffect(() => {
    let ok = true;
    (async () => {
      const s = window.SA || (await window.SAReady);
      if (ok) setSa(s || null);
    })();
    return () => (ok = false);
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
