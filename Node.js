export const handler = async (event) => {
  // ... do work ...
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://d1682i07dc1r3k.cloudfront.net',
      'Access-Control-Allow-Credentials': 'true',        // optional if you need cookies
      'Vary': 'Origin'                                   // good cache hygiene
    },
    body: JSON.stringify({ ok: true })
  };
};
