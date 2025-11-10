// site/src/lib/graphql.ts
export async function callHello(appsyncUrl: string, idToken: string) {
  const res = await fetch(appsyncUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // IMPORTANT: for Cognito User Pools, the raw ID token goes here
      Authorization: idToken,
    },
    body: JSON.stringify({
      query: `query Hello { hello }`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AppSync HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data.hello as string;
}
