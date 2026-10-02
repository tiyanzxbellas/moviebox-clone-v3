import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const tabId = req.query.tabId || '';
  if (!tabId) return res.status(400).json({ code: 400, message: 'tabId required' });
  try {
    const { json } = await upstream(`/wefeed-h5api-bff/tab-operating?tabId=${encodeURIComponent(tabId)}&host=themoviebox.org`, { lang: 'id', token: getAuth(req) });
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
