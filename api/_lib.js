const crypto = require('crypto');
function makeToken() {
  const e = Math.floor(Date.now() / 1000);
  const rev = String(e).split('').reverse().join('');
  const md5 = crypto.createHash('md5').update(rev).digest('hex');
  return e + ',' + md5;
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
  const url = UPSTREAM + path;
  const opt = { method: method, headers: baseHeaders(lang, extraHeaders, token) };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(url, opt);
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch (e) { j = { raw: text.slice(0, 4000) }; }
  return { status: r.status, json: j };
}
module.exports = { makeToken, getAuth, baseHeaders, cors, upstream };
