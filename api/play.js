import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { subjectId = '', se = '', ep = '', detailPath = '' } = req.query;
  if (!subjectId) return res.status(400).json({ code: 400, message: 'subjectId required' });
  try {
    const token = getAuth(req);
    const q = `/wefeed-h5api-bff/subject/play?subjectId=${encodeURIComponent(subjectId)}&se=${encodeURIComponent(se)}&ep=${encodeURIComponent(ep)}&detailPath=${encodeURIComponent(detailPath)}`;
    const { json } = await upstream(q, { lang: 'id', token, extraHeaders: token ? {} : { 'X-Source': 'themoviebox.org' } });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
