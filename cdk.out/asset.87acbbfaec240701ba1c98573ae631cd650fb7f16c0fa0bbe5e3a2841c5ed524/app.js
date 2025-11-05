/* app.js - Styling Adventures (no build tools) */

/* -------------------- tiny helpers -------------------- */
const loadScript = (src) =>
  new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

async function ensureReact() {
  if (window.React && window.ReactDOM) return;
  await loadScript("https://unpkg.com/react@18/umd/react.production.min.js");
  await loadScript("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js");
}
const e = (...args) => React.createElement(...args);

/* -------------------- crypto utilities (PKCE) -------------------- */
const b64url = (u8) =>
  btoa(String.fromCharCode(...u8)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const randomStr = (len = 32) => b64url(crypto.getRandomValues(new Uint8Array(len)));
async function sha256B64Url(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return b64url(new Uint8Array(digest));
}

/* -------------------- token storage -------------------- */
const tokens = {
  get id()      { return sessionStorage.getItem("id_token") || ""; },
  get access()  { return sessionStorage.getItem("access_token") || ""; },
  get refresh() { return sessionStorage.getItem("refresh_token") || ""; },
  setAll(t) {
    if (t.id_token) {
      sessionStorage.setItem("id_token", t.id_token);
      // mirror (some older code checks this)
      localStorage.setItem("sa_id_token", t.id_token);
    }
    if (t.access_token) sessionStorage.setItem("access_token", t.access_token);
    if (t.refresh_token) sessionStorage.setItem("refresh_token", t.refresh_token);
  },
  clear() {
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    localStorage.removeItem("sa_id_token");
  }
};

/* -------------------- JWT helpers & refresh -------------------- */
function parseJwt(t) {
  const [, p] = String(t).split(".");
  if (!p) return {};
  try {
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return {}; }
}

function tokenSecondsLeft() {
  const t = tokens.id;
  if (!t) return 0;
  try {
    const { exp } = parseJwt(t);
    // tolerate small clock skew
    return Math.floor(exp - (Date.now() / 1000) - 10);
  } catch { return 0; }
}

async function ensureFreshToken(cfg) {
  if (tokenSecondsLeft() > 60) return;
  const rt = tokens.refresh;
  if (!rt) throw new Error("Session expired. Please sign in again.");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.clientId,
    refresh_token: rt,
  });

  const res = await fetch(
    `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/oauth2/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );
  if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
  const t = await res.json();
  tokens.setAll(t);
}

/* -------------------- uploads/thumbs helpers -------------------- */
// Map original object key -> thumbnail key (your Lambda writes to "thumbs/<original>")
function toThumbKey(originalKey) {
  const k = decodeURIComponent(originalKey || "");
  if (!k) return "";
  return k.startsWith("thumbs/") ? k : `thumbs/${k.replace(/^\/+/, "")}`;
}
function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

/* -------------------- handle OAuth code on callback -------------------- */
async function maybeHandleCallback(cfg) {
  if (!cfg) return;
  const u = new URL(location.href);
  const code = u.searchParams.get("code");
  if (!code) return;
  const verifier = sessionStorage.getItem("pkce_verifier");
  if (!verifier) return;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    code,
    redirect_uri: cfg.redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch(
    `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/oauth2/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );
  if (!res.ok) throw new Error(`Login exchange failed (${res.status})`);
  const t = await res.json();
  tokens.setAll(t);

  // clean URL (drop ?code=…)
  u.searchParams.delete("code");
  u.searchParams.delete("state");
  history.replaceState({}, "", u.pathname);
}

/* -------------------- React App -------------------- */
function App() {
  const [cfg, setCfg]           = React.useState(null);
  const [busy, setBusy]         = React.useState(false);
  const [error, setError]       = React.useState("");
  const [hello, setHello]       = React.useState("");
  const [uploadKey, setKey]     = React.useState("users/manual-test/test.jpg");
  const [items, setItems]       = React.useState([]);   // raw keys from /list
  const [thumbReady, setReady]  = React.useState({});   // key -> boolean
  const [file, setFile]         = React.useState(null);

  const isAuthed = Boolean(tokens.id);

  /* Load config once: try v2 first, then fallback to config.json */
  React.useEffect(() => {
    (async () => {
      try {
        const tryLoad = async (path) => {
          const r = await fetch(`${path}?ts=${Date.now()}`, { cache: "no-store" });
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        };
        let c;
        try { c = await tryLoad("/config.v2.json"); }
        catch { c = await tryLoad("/config.json"); }

        // Normalize uploads API base and thumbs CDN
        const base = (c.uploadsApiUrl || c.uploadsUrl || "").trim();
        if (!base) throw new Error('config missing "uploadsApiUrl"');
        c._uploadsBase = base.endsWith("/") ? base : base + "/";
        c._thumbsCdn   = (c.thumbsCdn || location.origin).replace(/\/+$/, "");

        window._cfg = c; // debug convenience
        setCfg(c);

        // If this page is the redirect URI page, complete OAuth
        await maybeHandleCallback(c);
      } catch (err) {
        setError("Failed to load config: " + err);
      }
    })();
  }, []);

  /* auth actions */
  async function startLogin() {
    try {
      setError("");
      const verifier  = randomStr(32);
      const challenge = await sha256B64Url(verifier);
      sessionStorage.setItem("pkce_verifier", verifier);

      const url = new URL(`https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/login`);
      url.searchParams.set("client_id", cfg.clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("redirect_uri", cfg.redirectUri);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("code_challenge", challenge);
      location.assign(url.toString());
    } catch (err) {
      setError(String(err));
    }
  }

  function logout() {
    tokens.clear();
    const url = new URL(`https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/logout`);
    url.searchParams.set("client_id", cfg.clientId);
    url.searchParams.set("logout_uri", cfg.logoutUri);
    location.assign(url.toString());
  }

  /* examples */
  async function callHello() {
    setBusy(true); setError(""); setHello("");
    try {
      await ensureFreshToken(cfg);
      const res  = await fetch(cfg.appSyncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": tokens.id },
        body: JSON.stringify({ query: "{ hello }" })
      });
      const json = await res.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      setHello(json.data.hello);
    } catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }

  async function presignAndUpload() {
    setBusy(true); setError("");
    try {
      if (!cfg?._uploadsBase) throw new Error("uploadsApiUrl not ready");
      await ensureFreshToken(cfg);

      const keyToUse = uploadKey || (file ? `users/manual-test/${file.name}` : "");
      if (!keyToUse) throw new Error("Please provide a key or pick a file.");

      // 1) presign
      const mime = file ? (file.type || inferMime(file.name)) : inferMime(keyToUse);
      const pre = await fetch(cfg._uploadsBase + "presign", {
        method: "POST",
        headers: { "Authorization": tokens.id, "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToUse, contentType: mime })
      }).then(async r => (r.ok ? r.json() : Promise.reject(await r.text())));

      if (!pre?.url) throw new Error("Presign response missing url");

      // 2) upload
      const body = file
        ? file
        : (isText(keyToUse) ? new Blob(["hello from the browser"], { type: mime }) : new Uint8Array([0xFF, 0xD8, 0xFF]));
      await fetch(pre.url, { method: "PUT", headers: { "Content-Type": mime }, body })
        .then(async r => (r.ok ? r : Promise.reject("S3 PUT failed " + r.status)));

      // 3) refresh list/gallery
      await listUploads();
    } catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }

  async function listUploads() {
    setBusy(true); setError("");
    try {
      await ensureFreshToken(cfg);
      const lst = await fetch(cfg._uploadsBase + "list", {
        headers: { "Authorization": tokens.id }
      }).then(async r => (r.ok ? r.json() : Promise.reject(await r.text())));
      const keys = (lst.items || []).map(i => i.key || i);
      setItems(keys);
      keys.forEach(k => waitForThumb(k));
    } catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }

  // poll /thumb-head?key=<original>, mark ready/pending
  async function waitForThumb(originalKey) {
    if (!originalKey) return;
    const thumbKey = toThumbKey(originalKey);
    let tries = 0;
    while (tries++ < 20) {
      try {
        const url = cfg._uploadsBase + "thumb-head?key=" + encodeURIComponent(originalKey);
        const r = await fetch(url, { headers: { "Authorization": tokens.id } });
        if (r.ok) {
          const j = await r.json();
          if (j && j.ready) {
            setReady(prev => ({ ...prev, [thumbKey]: true }));
            return;
          }
        }
      } catch { /* ignore */ }
      await new Promise(r => setTimeout(r, 750));
    }
    setReady(prev => ({ ...prev, [thumbKey]: false }));
  }

  /* utilities */
  function inferMime(key) {
    return /\.(png)$/i.test(key) ? "image/png"
         : /\.(jpe?g)$/i.test(key) ? "image/jpeg"
         : /\.(webp)$/i.test(key) ? "image/webp"
         : "text/plain";
  }
  const isText = (key) => !/\.(png|jpe?g|webp|gif)$/i.test(key);

  // legacy globals for quick testing
  React.useEffect(() => {
    window.startUpload = presignAndUpload;
    window.listUploads  = listUploads;
  }, [cfg, uploadKey, file]);

  if (!cfg) {
    return e("div", { className: "p-8 text-sm text-zinc-600" },
      "Loading config… ",
      error && e("span", { className: "text-red-500" }, String(error))
    );
  }

  const authedBlock = isAuthed && e(React.Fragment, null,
    /* Status */
    e("section", { className: "card" },
      e("h2", { className: "card-title" }, "Status"),
      e("div", { className: "text-xs text-zinc-500 space-y-1" },
        e("p", { className: "break-all" }, "ID token (prefix): ", tokens.id.slice(0, 30), "…"),
        (() => {
          try {
            const payload = parseJwt(tokens.id);
            const email = payload.email || "(no email)";
            const sub   = payload.sub   || "(no sub)";
            const mins  = Math.max(0, Math.round(((payload.exp || 0) * 1000 - Date.now()) / 60000));
            return e("div", null,
              e("div", null, "Signed-in user:"),
              e("div", null, email),
              e("div", null, "id: ", sub),
              e("div", null, `Token expires in ~${mins}m`),
            );
          } catch { return null; }
        })()
      )
    ),

    /* AppSync hello */
    e("section", { className: "card space-y-4" },
      e("h2", { className: "card-title" }, "AppSync hello"),
      e("div", { className: "flex gap-3" },
        e("button", { className: "btn", onClick: callHello, disabled: busy }, busy ? "Calling…" : "Call { hello }"),
        hello && e("code", { className: "px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded" }, hello)
      )
    ),

    /* Uploads + List */
    e("section", { className: "card space-y-4" },
      e("h2", { className: "card-title" }, "Uploads"),
      e("div", { className: "flex flex-wrap items-center gap-2" },
        e("label", { className: "text-sm" }, "Key:"),
        e("input", { className: "input w-80", value: uploadKey, onChange: (ev) => setKey(ev.target.value) }),
        e("input", { type: "file", className: "input", onChange: (ev) => setFile(ev.target.files?.[0] || null) }),
        e("button", { className: "btn", onClick: presignAndUpload, disabled: busy }, busy ? "Uploading…" : "Upload"),
        e("button", { className: "btn", onClick: listUploads, disabled: busy }, busy ? "Listing…" : "List")
      ),
      items.length > 0 && e("ul", { className: "text-sm list-disc pl-5 space-y-1" },
        items.map((k) => e("li", { key: "li-" + k }, k))
      )
    ),

    /* Gallery (CloudFront -> uploads bucket /thumbs/*) */
    items.length > 0 && e("section", { className: "card space-y-3" },
      e("h2", { className: "card-title" }, "Thumbnails"),
      e("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" },
        items.map((orig) => {
          const tk = toThumbKey(orig);
          const src = joinUrl(cfg._thumbsCdn, tk);
          const ready = thumbReady[tk];
          return e("figure", {
              key: "img-" + orig,
              className: "rounded overflow-hidden border p-2 text-center"
            },
            e("img", {
              src,
              alt: tk,
              className: "w-full h-36 object-contain bg-zinc-50",
              onError: () => { /* show broken until thumb exists */ }
            }),
            e("figcaption", { className: "mt-1 text-xs text-zinc-600 break-all" },
              ready === true ? "ready" : ready === false ? "pending/timeout" : "checking…"
            )
          );
        })
      )
    ),
  );

  return e("div", { className: "max-w-4xl mx-auto p-6 space-y-6" },
    /* Header */
    e("header", { className: "flex items-center justify-between" },
      e("h1", { className: "text-2xl font-semibold" }, "Styling Adventures"),
      isAuthed
        ? e("button", { className: "btn", onClick: logout }, "Sign out")
        : e("button", { className: "btn-primary", onClick: startLogin }, "Sign in")
    ),
    isAuthed ? authedBlock : e("section", { className: "card" },
      e("p", null, "You are signed out. Sign in to upload and view thumbnails.")
    ),
    error && e("p", { className: "text-sm text-red-500 break-all" }, String(error))
  );
}

/* -------------------- bootstrap -------------------- */
(async function main() {
  await ensureReact();
  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();

