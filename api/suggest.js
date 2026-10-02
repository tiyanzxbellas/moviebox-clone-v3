import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  body = body && typeof body === 'object' ? body : {};
  const keyword = body.keyword || req.query.keyword || '';
  const perPage = Number(body.perPage || req.query.perPage || 10);
  if (!keyword) return res.status(400).json({ code: 400, message: 'keyword required' });
  try {
    const { json } = await upstream('/wefeed-h5api-bff/subject/search-suggest', { method: 'POST', body: { keyword, perPage }, lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
