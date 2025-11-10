(async () => {
  function getSA() {
    return window.getSA ? window.getSA() : Promise.resolve(window.SA);
  }

  const btnHello = document.getElementById('btn-hello');
  const helloOut = document.getElementById('hello-out');
  if (btnHello && helloOut) {
    btnHello.addEventListener('click', async () => {
      try {
        const SA = await getSA();
        const data = await SA.gql(`query { hello }`);
        helloOut.textContent = data.hello || 'ok';
      } catch (e) {
        helloOut.textContent = 'Error: ' + (e?.message || e);
      }
    });
  }

  const btnMe = document.getElementById('btn-load-me');
  const preMe = document.getElementById('me');
  if (btnMe && preMe) {
    btnMe.addEventListener('click', async () => {
      try {
        const SA = await getSA();
        // your API exposes Query.me returning UserProfile
        const data = await SA.gql(`query { me { id email role tier createdAt updatedAt } }`);
        preMe.textContent = JSON.stringify(data.me, null, 2);
        preMe.classList.remove('sa-muted');
      } catch (e) {
        preMe.textContent = 'Error: ' + (e?.message || e);
      }
    });
  }
})();
