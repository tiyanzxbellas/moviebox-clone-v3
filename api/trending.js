import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const page = Number(req.query.page || 1), perPage = Number(req.query.perPage || 18);
  const tabId = req.query.tabId ? `&tabId=${encodeURIComponent(req.query.tabId)}` : '';
  try {
    const { json } = await upstream(`/wefeed-h5api-bff/subject/trending?page=${page}&perPage=${perPage}${tabId}`, { lang: 'id', token: getAuth(req) });
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
