/**
 * 3D Print Calculator – Cloudflare Worker
 * Slaat app-data op in KV en bedient de HTML met een eenvoudige REST-API.
 *
 * Endpoints:
 *   GET  /api/data        → geeft de opgeslagen JSON terug (publiek)
 *   POST /api/data        → slaat nieuwe JSON op (vereist X-Api-Key header)
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    };

    /* Preflight */
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/api/data') {
      return new Response('Not Found', { status: 404, headers: cors });
    }

    /* ── GET ── publiek leesbaar */
    if (request.method === 'GET') {
      const raw = await env.APP_DATA.get('app_data');
      return new Response(raw ?? 'null', {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    /* ── POST ── beveiligd met API-sleutel */
    if (request.method === 'POST') {
      const key = request.headers.get('X-Api-Key') ?? '';
      if (!env.API_SECRET || key !== env.API_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      const body = await request.text();
      try {
        JSON.parse(body); // valideer JSON
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      await env.APP_DATA.put('app_data', body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405, headers: cors });
  },
};
