import { useEffect } from "react";

export default function BestieRedirect() {
  useEffect(() => {
    // Hard navigate to the static page so it runs outside the SPA.
    window.location.replace("/bestie/index.html");
  }, []);
  return null;
}
