// Creator dashboard wiring — waits for SA
(function () {
  function $(s, r = document) { return r.querySelector(s); }
  const byText = (tag, text) =>
    Array.from(document.getElementsByTagName(tag)).find(
      (el) => (el.textContent || '').trim().toLowerCase() === text.toLowerCase()
    );

  async function wire() {
    const SA = await window.SAReady;

    byText('button','List myCloset')?.addEventListener('click', async () => {
      try {
        const data = await SA.gql(`query { myCloset { id status title } }`);
        const pre = $('.creator-list') || document.createElement('pre');
        pre.className = 'creator-list';
        pre.textContent = JSON.stringify(data.myCloset, null, 2);
        (byText('button','List myCloset').closest('section')||document.body).appendChild(pre);
      } catch (e) { alert(e.message || e); }
    });

    byText('button','Create DRAFT')?.addEventListener('click', async () => {
      const title = $('input[placeholder="Title (optional)"]')?.value || 'Untitled';
      const s3Key = $('input[placeholder="S3 key (optional)"]')?.value || null;
      try {
        const data = await SA.gql(
          `mutation($title:String,$s3:String){ creatorCreateDraft(title:$title, s3Key:$s3){ id status title } }`,
          { title, s3: s3Key }
        );
        alert(`Draft created: ${data.creatorCreateDraft.id}`);
      } catch (e) { alert(e.message || e); }
    });

    byText('button','Request approval')?.addEventListener('click', async () => {
      const id = $('input[placeholder="Closet item id"]')?.value?.trim();
      if (!id) return alert('Enter an item id.');
      try {
        const data = await SA.gql(`mutation($id:ID!){ creatorRequestApproval(id:$id) }`, { id });
        alert(data.creatorRequestApproval || 'Requested!');
      } catch (e) { alert(e.message || e); }
    });
  }

  if (window.SAReady) wire();
  else {
    console.warn('SA (from app.js) not loaded');
    window.addEventListener('sa:ready', wire, { once: true });
  }
})();

