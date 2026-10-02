const { cors, upstream, getAuth } = require('./_lib');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  body = body && typeof body === 'object' ? body : {};
  const { keyword = '', page = 1, perPage = 18, subjectType } = { ...req.query, ...body };
  if (!keyword) return res.status(400).json({ code: 400, message: 'keyword required' });
  const b = { keyword, page: Number(page), perPage: Number(perPage) };
  if (subjectType !== undefined && subjectType !== '') b.subjectType = Number(subjectType);
  try {
    const { json } = await upstream('/wefeed-h5api-bff/subject/search', { method: 'POST', body: b, lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
