// Minimal topbar wiring for static pages (Bestie, etc.)
(function () {
  const emailEl = document.getElementById("who-email");
  const signin = document.getElementById("signin");
  const signout = document.getElementById("signout");

  async function refresh() {
    try {
      const SA = await (window.getSA?.() || Promise.resolve(null));
      if (!SA || !SA.isSignedIn?.()) {
        if (emailEl) emailEl.textContent = "Not signed in";
        return;
      }
      const u = SA.getUser?.() || {};
      if (emailEl) emailEl.textContent = u.email || "Signed in";
    } catch {/* ignore */}
  }

  document.addEventListener("click", async (e) => {
    if (e.target?.id === "signin") {
      e.preventDefault();
      (await window.getSA()).startLogin();
    }
    if (e.target?.id === "signout") {
      e.preventDefault();
      (await window.getSA()).logoutEverywhere();
    }
  });

  window.addEventListener("sa:ready", refresh);
  refresh();
})();
