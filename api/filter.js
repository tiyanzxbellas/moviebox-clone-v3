import { cors, upstream, getAuth } from './_lib.js';
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  body = body && typeof body === 'object' ? body : {};
  // support: direct passthrough + filterType JSON string from Kategori cards
  let merged = { page: 1, perPage: 18, ...req.query, ...body };
  if (typeof merged.filterType === 'string') {
    try { Object.assign(merged, JSON.parse(merged.filterType)); delete merged.filterType; } catch {}
  }
  if (merged.filterType && typeof merged.filterType === 'object') {
    Object.assign(merged, merged.filterType); delete merged.filterType;
  }
  merged.page = Number(merged.page || 1); merged.perPage = Number(merged.perPage || 18);
  if (merged.tabId !== undefined) merged.tabId = Number(merged.tabId);
  try {
    const { json } = await upstream('/wefeed-h5api-bff/subject/filter', { method: 'POST', body: merged, lang: 'id', token: getAuth(req) });
    return res.status(200).json(json);
  } catch (e) { return res.status(500).json({ code: 500, message: String(e) }); }
}
