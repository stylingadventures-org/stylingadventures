import { useEffect, useRef, useState } from "react";

export function useLevelUp(level: number) {
  const prev = useRef(level);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    if (level > prev.current) {
      setPopped(true);
      const t = setTimeout(() => setPopped(false), 1800);
      prev.current = level;
      return () => clearTimeout(t);
    }
    prev.current = level;
  }, [level]);

  return popped;
}
