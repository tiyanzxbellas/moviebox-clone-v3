const { cors, upstream, getAuth } = require('./_lib');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const id = req.query.subjectId || req.query.id || '';
  if (!id) return res.status(400).json({ code: 400, message: 'subjectId required' });
  const page = Number(req.query.page || 1);
  const perPage = Number(req.query.perPage || 12);
  try {
    const { json } = await upstream(`/wefeed-h5api-bff/subject/detail-rec?subjectId=${encodeURIComponent(id)}&page=${page}&perPage=${perPage}`, { lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
