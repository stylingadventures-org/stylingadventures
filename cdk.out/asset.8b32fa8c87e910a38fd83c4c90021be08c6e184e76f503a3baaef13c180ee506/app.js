// Minimal React app that:
async function presignAndUpload() {
setBusy(true); setError('');
try {
// presign
const r = await fetch(cfg.uploadsUrl + 'presign', {
method: 'POST',
headers: { 'Authorization': tok.id, 'Content-Type': 'application/json' },
body: JSON.stringify({ key: uploadKey, contentType: 'text/plain' })
}).then(r => r.json());
// PUT small content
await fetch(r.url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'hello from the browser' });
// list
const lst = await fetch(cfg.uploadsUrl + 'list', { headers: { 'Authorization': tok.id } }).then(r => r.json());
setList(lst.items || []);
} catch (err) { setError(String(err)); }
finally { setBusy(false); }
}


if (!cfg) {
return e('div', { className: 'p-8' }, 'Loading config… ', error && e('span', { className: 'text-red-500' }, error));
}


const authed = !!tok.id;


return e('div', { className: 'max-w-3xl mx-auto p-6 space-y-6' },
e('header', { className: 'flex items-center justify-between' },
e('h1', { className: 'text-2xl font-semibold' }, 'Styling Adventures'),
authed
? e('button', { className: 'btn', onClick: logout }, 'Sign out')
: e('button', { className: 'btn-primary', onClick: startLogin }, 'Sign in')
),


e('section', { className: 'card' },
e('h2', { className: 'card-title' }, 'Status'),
e('p', null, authed ? 'You are signed in.' : 'You are signed out.'),
authed && e('p', { className: 'text-xs text-zinc-500 break-all' }, 'ID token (prefix): ', tok.id.slice(0, 30), '…')
),


authed && e('section', { className: 'card space-y-4' },
e('h2', { className: 'card-title' }, 'AppSync hello'),
e('div', { className: 'flex gap-3' },
e('button', { className: 'btn', onClick: callHello, disabled: busy }, busy ? 'Calling…' : 'Call { hello }'),
hello && e('code', { className: 'px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded' }, hello)
)
),


authed && e('section', { className: 'card space-y-4' },
e('h2', { className: 'card-title' }, 'Uploads'),
e('div', { className: 'flex items-center gap-2' },
e('label', { className: 'text-sm' }, 'Key:'),
e('input', { className: 'input', value: uploadKey, onChange: ev => setUploadKey(ev.target.value) }),
e('button', { className: 'btn', onClick: presignAndUpload, disabled: busy }, busy ? 'Uploading…' : 'Upload + List')
),
list.length > 0 && e('ul', { className: 'text-sm list-disc pl-5 space-y-1' }, list.map(k => e('li', { key: k }, k)))
),


error && e('p', { className: 'text-sm text-red-500' }, String(error))
);
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));