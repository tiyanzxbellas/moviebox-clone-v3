import crypto from 'crypto';

export function makeToken() {
  const e = Math.floor(Date.now() / 1000);
  const rev = String(e).split('').reverse().join('');
  const md5 = crypto.createHash('md5').update(rev).digest('hex');
  return `${e},${md5}`;
}

export function getAuth(req) {
  const h = (req.headers || {});
  const t = h['x-mb-token'] || h['x-mb_token'] || '';
  const a = h['authorization'] || h['Authorization'] || '';
  if (a && a.startsWith('Bearer ')) return a;
  if (t) return `Bearer ${t}`;
  return '';
}

export function baseHeaders(lang = 'id', extra = {}, token = '') {
  const h = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
    'X-Request-Lang': lang,
    'Referer': 'https://themoviebox.org/',
    'User-Agent': 'MovieBoxClone/1.0',
    ...extra,
  };
  if (token) h['Authorization'] = token;
  else h['X-Client-Token'] = makeToken();
  return h;
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mb-Token, Authorization');
}

const UPSTREAM = 'https://h5-api.aoneroom.com';

export async function upstream(path, { method = 'GET', body = null, lang = 'id', token = '', extraHeaders = {} } = {}) {
  const url = UPSTREAM + path;
  const opt = { method, headers: baseHeaders(lang, extraHeaders, token) };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(url, opt);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 4000) }; }
  return { status: r.status, json };
}
