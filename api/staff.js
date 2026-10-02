import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const staffId = req.query.staffId || '';
  if (!staffId) return res.status(400).json({ code: 400, message: 'staffId required' });
  const page = Number(req.query.page || 1), perPage = Number(req.query.perPage || 12);
  try {
    const [a, b] = await Promise.all([
      upstream(`/wefeed-h5api-bff/staff/subject-list?perPage=${perPage}&page=${page}&staffId=${encodeURIComponent(staffId)}`, { lang: 'id', token: getAuth(req) }),
      upstream(`/wefeed-h5api-bff/staff/staff-related?staffId=${encodeURIComponent(staffId)}`, { lang: 'id', token: getAuth(req) }),
    ]);
    return res.status(200).json({ code: 0, data: { list: a.json?.data || a.json, related: b.json?.data || b.json } });
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
