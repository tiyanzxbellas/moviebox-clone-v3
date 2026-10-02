const crypto = require('crypto');
function makeToken() {
  const e = Math.floor(Date.now() / 1000);
  const rev = String(e).split('').reverse().join('');
  return e + ',' + crypto.createHash('md5').update(rev).digest('hex');
}
function getAuth(req) {
  const h = req.headers || {};
  const t = h['x-mb-token'] || h['x-mb_token'] || '';
  const a = h['authorization'] || h['Authorization'] || '';
  if (a && a.indexOf('Bearer ') === 0) return a;
  if (t) return 'Bearer ' + t;
  return '';
}
function baseHeaders(lang, extra, token) {
  lang = lang || 'id'; extra = extra || {};
  const h = Object.assign({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
    'X-Request-Lang': lang,
    'Referer': 'https://themoviebox.org/',
    'User-Agent': 'MovieBoxClone/1.0'
  }, extra);
  if (token) h['Authorization'] = token;
  else h['X-Client-Token'] = makeToken();
  return h;
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mb-Token, Authorization');
}
const UPSTREAM = 'https://h5-api.aoneroom.com';
async function upstream(path, opts) {
  opts = opts || {};
  const method = opts.method || 'GET';
  const body = opts.body || null;
  const lang = opts.lang || 'id';
  const token = opts.token || '';
  const extraHeaders = opts.extraHeaders || {};
  const r = await fetch(UPSTREAM + path, {
    method: method,
    headers: baseHeaders(lang, extraHeaders, token),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  try { return { status: r.status, json: JSON.parse(text) }; }
  catch (e) { return { status: r.status, json: { raw: text.slice(0, 4000) } }; }
}
async function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    if (!chunks.length) return {};
    const s = Buffer.concat(chunks).toString();
    if (!s) return {};
    try { return JSON.parse(s); } catch (e) { return {}; }
  } catch (e) { return {}; }
}
function num(v, d) { const n = Number(v); return isNaN(n) ? d : n; }
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const q = req.query || {};
  let endpoint = (q.endpoint || '').toString().toLowerCase();
  // fallback: parse from url /api/xxx
  if (!endpoint && req.url) {
    const m = req.url.match(/\/api\/([a-z-]+)/);
    if (m) endpoint = m[1].toLowerCase();
  }
  const token = getAuth(req);
  try {
    if (endpoint === 'home') {
      const { json } = await upstream('/wefeed-h5api-bff/home?host=themoviebox.org', { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'filter') {
      const body = req.method === 'POST' ? await getBody(req) : {};
      let merged = Object.assign({ page: 1, perPage: 18 }, q, body);
      delete merged.endpoint;
      if (typeof merged.filterType === 'string') {
        try { Object.assign(merged, JSON.parse(merged.filterType)); } catch (e) {}
        delete merged.filterType;
      }
      if (merged.filterType && typeof merged.filterType === 'object') {
        Object.assign(merged, merged.filterType); delete merged.filterType;
      }
      merged.page = num(merged.page, 1); merged.perPage = num(merged.perPage, 18);
      if (merged.tabId !== undefined) merged.tabId = num(merged.tabId, merged.tabId);
      const { json } = await upstream('/wefeed-h5api-bff/subject/filter', { method: 'POST', body: merged, lang: 'id', token });
      return res.status(200).json(json);
    }
    if (endpoint === 'detail') {
      const id = q.subjectId || q.id || '';
      if (!id) return res.status(400).json({ code: 400, message: 'subjectId required' });
      const { json } = await upstream('/wefeed-h5api-bff/detail?subjectId=' + encodeURIComponent(id), { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'play') {
      const subjectId = q.subjectId || '';
      if (!subjectId) return res.status(400).json({ code: 400, message: 'subjectId required' });
      const se = q.se || '', ep = q.ep || '', detailPath = q.detailPath || '';
      const path = '/wefeed-h5api-bff/subject/play?subjectId=' + encodeURIComponent(subjectId) + '&se=' + encodeURIComponent(se) + '&ep=' + encodeURIComponent(ep) + '&detailPath=' + encodeURIComponent(detailPath);
      const { json } = await upstream(path, { lang: 'id', token, extraHeaders: token ? {} : { 'X-Source': 'themoviebox.org' } });
      return res.status(200).json(json);
    }
    if (endpoint === 'search') {
      const body = req.method === 'POST' ? await getBody(req) : {};
      const m = Object.assign({}, q, body);
      const keyword = m.keyword || '';
      if (!keyword) return res.status(400).json({ code: 400, message: 'keyword required' });
      const b = { keyword: keyword, page: num(m.page, 1), perPage: num(m.perPage, 18) };
      if (m.subjectType !== undefined && m.subjectType !== '') b.subjectType = Number(m.subjectType);
      const { json } = await upstream('/wefeed-h5api-bff/subject/search', { method: 'POST', body: b, lang: 'id', token });
      return res.status(200).json(json);
    }
    if (endpoint === 'suggest') {
      const body = req.method === 'POST' ? await getBody(req) : {};
      const m = Object.assign({}, q, body);
      const keyword = m.keyword || '';
      if (!keyword) return res.status(400).json({ code: 400, message: 'keyword required' });
      const { json } = await upstream('/wefeed-h5api-bff/subject/search-suggest', { method: 'POST', body: { keyword: keyword, perPage: num(m.perPage, 10) }, lang: 'id', token });
      return res.status(200).json(json);
    }
    if (endpoint === 'rec') {
      const id = q.subjectId || q.id || '';
      if (!id) return res.status(400).json({ code: 400, message: 'subjectId required' });
      const { json } = await upstream('/wefeed-h5api-bff/subject/detail-rec?subjectId=' + encodeURIComponent(id) + '&page=' + num(q.page,1) + '&perPage=' + num(q.perPage,12), { lang: 'id', token });
      return res.status(200).json(json);
    }
    if (endpoint === 'ranking') {
      const id = q.id || q.opId || '';
      if (!id) return res.status(400).json({ code: 400, message: 'id (opId) required' });
      const { json } = await upstream('/wefeed-h5api-bff/ranking-list/content?id=' + encodeURIComponent(id) + '&page=' + num(q.page,1) + '&perPage=' + num(q.perPage,18), { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'trending') {
      const tab = q.tabId ? '&tabId=' + encodeURIComponent(q.tabId) : '';
      const { json } = await upstream('/wefeed-h5api-bff/subject/trending?page=' + num(q.page,1) + '&perPage=' + num(q.perPage,18) + tab, { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'upcoming') {
      const cat = q.category ? '&category=' + encodeURIComponent(q.category) : '';
      const { json } = await upstream('/wefeed-h5api-bff/upcoming-subject-list?page=' + num(q.page,1) + '&perPage=' + num(q.perPage,18) + cat, { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'tabs') {
      const { json } = await upstream('/wefeed-h5api-bff/tab/get-bottom-tab-list', { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
      return res.status(200).json(json);
    }
    if (endpoint === 'tab') {
      const tabId = q.tabId || '';
      if (!tabId) return res.status(400).json({ code: 400, message: 'tabId required' });
      const { json } = await upstream('/wefeed-h5api-bff/tab-operating?tabId=' + encodeURIComponent(tabId) + '&host=themoviebox.org', { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'everyone') {
      const { json } = await upstream('/wefeed-h5api-bff/subject/everyone-search', { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json(json);
    }
    if (endpoint === 'comments') {
      const id = q.id || q.subjectId || '';
      if (!id) return res.status(400).json({ code: 400, message: 'id required' });
      const { json } = await upstream('/wefeed-h5-bff/post/list/subject?id=' + encodeURIComponent(id) + '&page=' + num(q.page,1) + '&perPage=' + num(q.perPage,12), { lang: 'id', token });
      return res.status(200).json(json);
    }
    if (endpoint === 'staff') {
      const staffId = q.staffId || '';
      if (!staffId) return res.status(400).json({ code: 400, message: 'staffId required' });
      const page = num(q.page,1), perPage = num(q.perPage,12);
      const [a, b] = await Promise.all([
        upstream('/wefeed-h5api-bff/staff/subject-list?perPage=' + perPage + '&page=' + page + '&staffId=' + encodeURIComponent(staffId), { lang: 'id', token }),
        upstream('/wefeed-h5api-bff/staff/staff-related?staffId=' + encodeURIComponent(staffId), { lang: 'id', token })
      ]);
      return res.status(200).json({ code: 0, data: { list: (a.json && a.json.data) || a.json, related: (b.json && b.json.data) || b.json } });
    }
    if (endpoint === 'share') {
      const body = req.method === 'POST' ? await getBody(req) : {};
      const action = q.action || body.action || 'share';
      if (action === 'unlock' || action === 'qrcode') {
        const p = action === 'unlock' ? '/wefeed-h5api-bff/share-unlock' : '/wefeed-h5api-bff/qrcode-unlock';
        const { json } = await upstream(p, { method: 'POST', body: { limitedCode: body.limitedCode || body.code || '' }, lang: 'id', token });
        return res.status(200).json(json);
      }
      const { json } = await upstream('/wefeed-h5api-bff/share', { method: 'POST', body: { url: body.url || q.url || 'https://themoviebox.org/id' }, lang: 'id', token });
      return res.status(200).json(json);
    }
    if (endpoint === 'app') {
      const appName = q.appName || 'moviebox';
      const { json } = await upstream('/wefeed-h5api-bff/app/get-latest-app-pkgs?appName=' + encodeURIComponent(appName), { lang: 'id', token });
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
      return res.status(200).json(json);
    }
    if (endpoint === 'platform') {
      const page = num(q.page,1), perPage = num(q.perPage,18);
      const platform = q.platform || 'Netflix';
      let path;
      if (q.type === 'month') {
        path = '/wefeed-h5api-bff/platform/play-list-month?page=' + page + '&perPage=' + perPage + '&platform=' + encodeURIComponent(platform);
        if (q.month) path += '&month=' + encodeURIComponent(q.month);
      } else {
        path = '/wefeed-h5api-bff/platform/play-list?page=' + page + '&perPage=' + perPage + '&platform=' + encodeURIComponent(platform);
      }
      const { json } = await upstream(path, { lang: 'id', token });
      return res.status(200).json(json);
    }
    return res.status(404).json({ code: 404, message: 'unknown endpoint: ' + endpoint });
  } catch (e) { return res.status(500).json({ code: 500, message: String(e && e.message || e) }); }
};
