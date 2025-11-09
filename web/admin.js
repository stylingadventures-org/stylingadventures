// Admin dashboard wiring — waits for SA
(function () {
  function $(s, r = document) { return r.querySelector(s); }
  const byText = (tag, text) =>
    Array.from(document.getElementsByTagName(tag)).find(
      (el) => (el.textContent || '').trim().toLowerCase() === text.toLowerCase()
    );

  async function wire() {
    const SA = await window.SAReady;

    byText('button','Load pending')?.addEventListener('click', async () => {
      try {
        const data = await SA.gql(`query { adminListPending { id status title } }`);
        const pre = $('.admin-list') || document.createElement('pre');
        pre.className = 'admin-list';
        pre.textContent = JSON.stringify(data.adminListPending, null, 2);
        (byText('button','Load pending').closest('section')||document.body).appendChild(pre);
      } catch (e) { alert(e.message || e); }
    });

    byText('button','Approve')?.addEventListener('click', async () => {
      const id = $(`input[placeholder="Item id"]`)?.value?.trim();
      try { await SA.gql(`mutation($id:ID!){ adminApprove(id:$id) }`, { id }); alert('Approved'); }
      catch (e) { alert(e.message || e); }
    });

    byText('button','Reject')?.addEventListener('click', async () => {
      const id = $(`input[placeholder="Item id"]`)?.value?.trim();
      const reason = $(`input[placeholder="Reason (optional)"]`)?.value || null;
      try {
        await SA.gql(`mutation($id:ID!,$reason:String){ adminReject(id:$id, reason:$reason) }`, { id, reason });
        alert('Rejected');
      } catch (e) { alert(e.message || e); }
    });
  }

  if (window.SAReady) wire();
  else {
    console.warn('SA (from app.js) not loaded');
    window.addEventListener('sa:ready', wire, { once: true });
  }
})();

