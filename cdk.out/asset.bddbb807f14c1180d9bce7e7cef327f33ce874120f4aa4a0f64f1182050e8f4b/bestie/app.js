// Bestie page script (static HTML). Relies on window.SA from /public/sa.js.

(async function () {
  // Wait for SA
  const sa = (await (window.getSA?.() || Promise.resolve(window.SA))) || {};
  const whoEl = document.getElementById("who-email");
  const helloOut = document.getElementById("hello-out");
  const mePre = document.getElementById("me");

  // Wire auth buttons
  document.getElementById("signin")?.addEventListener("click", (e) => {
    e.preventDefault();
    sa.startLogin?.();
  });
  document.getElementById("signout")?.addEventListener("click", () => {
    sa.logoutEverywhere?.();
  });

  // Show current user email (if any)
  try {
    const u = sa.getUser?.() || {};
    whoEl.textContent = u.email || "Guest";
  } catch { /* ignore */ }

  // “Load Profile” -> basic info from the ID token (no GQL needed)
  document.getElementById("btn-load-me")?.addEventListener("click", async () => {
    try {
      const u = sa.getUser?.() || {};
      mePre.classList.remove("sa-muted");
      mePre.textContent = JSON.stringify(u, null, 2);
    } catch (e) {
      mePre.textContent = (e && e.message) || String(e);
    }
  });

  // Call { hello }
  document.getElementById("btn-hello")?.addEventListener("click", async () => {
    helloOut.textContent = "Working…";
    try {
      const data = await sa.gql?.(`query { hello }`);
      helloOut.textContent = data?.hello ?? "(no result)";
    } catch (e) {
      helloOut.textContent = (e && e.message) || String(e);
    }
  });
})();
