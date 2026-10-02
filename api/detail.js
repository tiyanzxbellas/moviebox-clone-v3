const { cors, upstream, getAuth } = require('./_lib');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const id = req.query.subjectId || req.query.id || '';
  if (!id) return res.status(400).json({ code: 400, message: 'subjectId required' });
  try {
    const { json } = await upstream(`/wefeed-h5api-bff/detail?subjectId=${encodeURIComponent(id)}`, { lang: 'id', token: getAuth(req) });
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
