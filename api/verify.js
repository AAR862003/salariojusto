// SalarioJusto — verificación de Cloudflare Turnstile (Vercel Serverless Function)
// El Secret key NUNCA va en el código: se lee de la variable de entorno TURNSTILE_SECRET
// (configúrala en Vercel → Settings → Environment Variables). Si no está, no bloquea.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ success: false }); return; }
  try {
    const secret = process.env.TURNSTILE_SECRET;
    if (!secret) { res.status(200).json({ success: true, note: 'no-secret' }); return; } // aún sin configurar => no bloquea

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const token = body && body.token;
    if (!token) { res.status(200).json({ success: false }); return; }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);

    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = await r.json();
    res.status(200).json({ success: !!data.success });
  } catch (e) {
    res.status(200).json({ success: true, note: 'error' }); // fail-open: no rompemos el sitio si el endpoint falla
  }
}
