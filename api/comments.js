import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const id = req.query.id || req.query.subjectId || '';
  if (!id) return res.status(400).json({ code: 400, message: 'id required' });
  const page = Number(req.query.page || 1), perPage = Number(req.query.perPage || 12);
  try {
    const { json } = await upstream(`/wefeed-h5-bff/post/list/subject?id=${encodeURIComponent(id)}&page=${page}&perPage=${perPage}`, { lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
