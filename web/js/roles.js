export async function fetchMe(appsyncUrl, idToken) {
  const q = { query: `query Me { me { id email role tier } }` };
  const r = await fetch(appsyncUrl, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization': idToken },
    body: JSON.stringify(q)
  });
  const j = await r.json();
  if (j.errors) throw new Error(j.errors[0]?.message || 'me failed');
  return j.data.me;
}

export function canUpload(role) {
  return ['CREATOR','COLLAB','ADMIN'].includes(role || 'FAN');
}
