// Same-origin is the only caller this API has. The wildcard that used to be here
// applied to the authenticated routes too.
function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGIN || '').trim();
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
  if (allowed && origin === allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return headers;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  // The admin row is created by migrations/001_schema.sql. There is no runtime
  // seeder — one that invents a default PIN is a backdoor, and it cost a D1 read
  // on every single request.
  const response = await context.next();

  for (const [key, val] of Object.entries(corsHeaders(request, env))) {
    response.headers.set(key, val);
  }
  return response;
}
