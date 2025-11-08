(function () {
  const cfg = JSON.parse(document.getElementById("__cfg__").textContent);

  // --- helpers
  const $ = (sel) => document.querySelector(sel);
  const tbody = $("#tbody");
  const btnReload = $("#reload");
  const btnLogoutLocal = $("#logoutLocal");
  const btnLogoutEverywhere = $("#logoutEverywhere");

  function getTokens() {
    try {
      const raw = localStorage.getItem("token");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setStatusRow(text) {
    tbody.innerHTML = `<tr><td colspan="5" class="muted">${text}</td></tr>`;
  }

  function mustBeLoggedIn() {
    // Always navigate to cfg.loginUrl – never a literal placeholder
    window.location.assign(cfg.loginUrl);
  }

  function isExpired(tokens) {
    if (!tokens?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    // small safety skew
    return tokens.exp <= now + 30;
  }

  async function gql(query, variables) {
    const tokens = getTokens();
    if (!tokens || isExpired(tokens)) {
      return { error: "expired" };
    }
    const res = await fetch(cfg.GraphqlUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: tokens.id_token || tokens.accessToken || tokens.idToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401 || res.status === 403) {
      return { error: "unauthorized" };
    }
    const body = await res.json().catch(() => ({}));
    if (body.errors) {
      return { error: body.errors[0]?.message || "GraphQL error", details: body.errors };
    }
    return { data: body.data };
  }

  function row(item) {
    const tr = document.createElement("tr");
    const created = new Date(item.createdAt || item.created || Date.now()).toLocaleString();
    tr.innerHTML = `
      <td>${escapeHtml(item.title || "(untitled)")}</td>
      <td>${escapeHtml(item.ownerId || item.owner || "—")}</td>
      <td>${escapeHtml(item.status || "PENDING")}</td>
      <td>${created}</td>
      <td>
        <button class="btn btn-approve" data-id="${item.id}">Approve</button>
        <button class="btn btn-reject" data-id="${item.id}">Reject</button>
      </td>
    `;
    return tr;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  async function loadList() {
    setStatusRow("Loading…");
    const q = `
      query AdminListPending {
        adminListPending {
          id
          title
          status
          createdAt
          ownerId
        }
      }
    `;
    const { data, error } = await gql(q, {});
    if (error === "expired" || error === "unauthorized") {
      // clear and bounce to login
      localStorage.removeItem("token");
      mustBeLoggedIn();
      return;
    }
    if (error) {
      setStatusRow("Error: " + error);
      return;
    }
    const items = data?.adminListPending || [];
    if (!items.length) {
      setStatusRow("No pending items.");
      return;
    }
    tbody.innerHTML = "";
    for (const it of items) tbody.appendChild(row(it));
  }

  async function doApprove(id, approve) {
    const field = approve ? "adminApproveItem" : "adminRejectItem";
    const mut = `
      mutation DoAction($id: ID!) {
        ${field}(id: $id) { id status updatedAt }
      }
    `;
    const { error } = await gql(mut, { id });
    if (error === "expired" || error === "unauthorized") {
      localStorage.removeItem("token");
      mustBeLoggedIn();
      return;
    }
    if (error) {
      alert("Error: " + error);
      return;
    }
    await loadList();
  }

  // --- wire events
  btnReload?.addEventListener("click", loadList);
  btnLogoutLocal?.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.assign(cfg.logoutUrl || "/");
  });
  btnLogoutEverywhere?.addEventListener("click", () => {
    localStorage.removeItem("token");
    // send them to Cognito Hosted UI logout if you add it later; for now just go home
    window.location.assign(cfg.logoutUrl || "/");
  });

  // delegate action buttons
  tbody.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains("btn-approve")) {
      doApprove(t.dataset.id, true);
    } else if (t.classList.contains("btn-reject")) {
      doApprove(t.dataset.id, false);
    }
  });

  // --- bootstrap: require login, then load
  (function init() {
    const tokens = getTokens();
    if (!tokens || isExpired(tokens)) {
      mustBeLoggedIn();
      return;
    }
    loadList();
  })();
})();

