import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  body = body && typeof body === 'object' ? body : {};
  const action = req.query.action || body.action || 'share';
  try {
    if (action === 'unlock') {
      const { json } = await upstream('/wefeed-h5api-bff/share-unlock', { method: 'POST', body: { limitedCode: body.limitedCode || body.code || '' }, lang: 'id', token: getAuth(req) });
      return res.status(200).json(json);
    }
    if (action === 'qrcode') {
      const { json } = await upstream('/wefeed-h5api-bff/qrcode-unlock', { method: 'POST', body: { limitedCode: body.limitedCode || body.code || '' }, lang: 'id', token: getAuth(req) });
      return res.status(200).json(json);
    }
    const { json } = await upstream('/wefeed-h5api-bff/share', { method: 'POST', body: { url: body.url || req.query.url || 'https://themoviebox.org/id' }, lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
