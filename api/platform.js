const { cors, upstream, getAuth } = require('./_lib');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const page = Number(req.query.page || 1), perPage = Number(req.query.perPage || 18);
  const platform = req.query.platform || 'Netflix';
  const month = req.query.month ? `&month=${encodeURIComponent(req.query.month)}` : '';
  const isMonth = req.query.type === 'month';
  const path = isMonth
    ? `/wefeed-h5api-bff/platform/play-list-month?page=${page}&perPage=${perPage}&platform=${encodeURIComponent(platform)}${month}`
    : `/wefeed-h5api-bff/platform/play-list?page=${page}&perPage=${perPage}&platform=${encodeURIComponent(platform)}`;
  try {
    const { json } = await upstream(path, { lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
