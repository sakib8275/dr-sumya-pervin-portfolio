import { seedAdmin } from './lib/db.js';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    await seedAdmin(context.env);
  } catch {}
  const response = await context.next();
  for (const [key, val] of Object.entries(corsHeaders())) {
    response.headers.set(key, val);
  }
  return response;
}
