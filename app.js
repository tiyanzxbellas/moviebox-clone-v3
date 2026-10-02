/* MovieBox clone v3 — 100%: 20 endpoint live + favorites + login token + filter penuh + 180 eps + HLS */
let DATA=[],ALL=[],BANNER=[],FILTERS=[],OPS=[];
let curHero=0,heroTimer=null,curDetail=null,curSe=1,curEp=1,curSeasonList=[];
let curFilter={tabId:5,page:1,perPage:18,country:'All',genre:'All',sort:'Hottest',year:'All',classify:'All',title:'Filter'};
let favs=[];
try{favs=JSON.parse(localStorage.getItem('mb_favs')||'[]');}catch(e){favs=[];}
const NAV_PC=[
 {t:'Acara TV',i:'📺',href:'/id/newWeb/tv-series'},
 {t:'Film',i:'🎬',href:'/id/newWeb/movie'},
 {t:'Animasi',i:'✨',href:'/id/newWeb/animated-series'},
 {t:'Siaran Olahraga',i:'⚽',href:'/id/live/list?tab=live'},
 {t:'Paling Banyak Ditonton',i:'🏆',href:'/id/ranking-list'},
 {t:'Aplikasi MovieBox',i:'📲',href:'/id/download-app'},
 {t:'Upcoming',i:'🗓️',href:'/id/upcoming'},
 {t:'Platform',i:'🖥️',href:'/id/platform/Netflix'},
 {t:'Games',i:'🎮',href:'https://gamixo.org/'},
 {t:'Old Moviebox',i:'📼',href:'/id/old-moviebox'},
];
let TABS=[
 {t:'Beranda',i:'🏠',href:'/'},
 {t:'Film',i:'🎬',href:'/id/newWeb/movie'},
 {t:'Acara TV',i:'📺',href:'/id/newWeb/tv-series'},
 {t:'Games',i:'🎮',href:'https://gamixo.org/'},
 {t:'Novel',i:'📖',href:'/id/novel'},
];
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const coverOf=s=>(s&&(s.cover||s.image))||'';
const slugUrl=s=>s&&s.detailPath?'/id/moviesDetail/'+s.detailPath:'/';
const asliUrl=s=>s&&s.detailPath?'https://themoviebox.org/id/moviesDetail/'+s.detailPath:'https://themoviebox.org/id';
const FALLBACK_IMG='https://h5-static.aoneroom.com/oneroomProject/icon/moviebox-official.jpg';
function getToken(){try{return localStorage.getItem('mb_token')||'';}catch(e){return '';}}
function authH(extra){extra=extra||{};const t=getToken();if(t)extra['X-Mb-Token']=t;return extra;}
async function apiGet(path){const r=await fetch(path,{headers:Object.assign({Accept:'application/json'},authH())});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
async function apiPost(path,body){const r=await fetch(path,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},authH()),body:JSON.stringify(body)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
function normApi(s,section){return{title:s.title,genre:s.genre,country:s.countryName||s.country,date:s.releaseDate||s.date,rating:s.imdbRatingValue||s.rating,subjectId:String(s.subjectId),detailPath:s.detailPath,cover:(s.cover&&s.cover.url)||s.cover||s.image,subjectType:s.subjectType,trailer:(((s.trailer||{}).videoAddress||{}).url)||s.trailer||'',desc:s.description||'',section:section||'LIVE'};}
renderSide();renderTabs();updateFavCount();
fetch('data.json').then(r=>r.json()).then(d=>{
 DATA=d;ALL=[];
 d.forEach(op=>{OPS.push({title:op.title,type:op.type,opId:op.opId,genreTopId:op.genreTopId,position:op.position});(op.subjects||[]).forEach(s=>ALL.push(Object.assign({},s,{section:op.title})));});
 const b=DATA.find(o=>o.type==='BANNER');BANNER=(b&&(b.banner||[]))||[];
 const f=DATA.find(o=>o.type==='FILTER');FILTERS=(f&&(f.filters||[]))||[];
 renderFilters();renderHero();renderCat();
 $('stat').textContent=ALL.length+' judul, '+DATA.length+' section';
 $('count').textContent='Hasil scrape: '+ALL.length+' judul • '+BANNER.length+' banner • klik kartu untuk detail + trailer';
 autoHero();route();pingAPI();loadHot();loadLiveTabs();
}).catch(e=>{$('rows').innerHTML='<p style=color:#888>Gagal load data.json — '+esc(e)+'</p>';});
async function pingAPI(){try{const j=await apiGet('/api/home');const ok=j&&(j.code===0||j.data);$('apiDot').className='api-dot '+(ok?'ok':'bad');$('apiDot').title=ok?'API live OK (/api/*)':'API belum live (mode statis data.json)';}catch(e){const d=$('apiDot');if(d)d.className='api-dot bad';}}
function renderSide(){$('sideNav').innerHTML=[{t:'Beranda',i:'🏠',href:'/'}].concat(NAV_PC).map(n=>'<a class="pc-nav-item" data-href="'+esc(n.href)+'" onclick="go(\''+esc(n.href)+'\');return false"><span>'+n.i+'</span><span class="t">'+esc(n.t)+'</span></a>').join('');}
function renderTabs(){$('mTabs').innerHTML=TABS.map(n=>'<button onclick="go(\''+esc(n.href)+'\')"><i>'+n.i+'</i>'+esc(n.t)+'</button>').join('');}
async function loadLiveTabs(){try{const j=await apiGet('/api/tabs');const bt=((j.data||{}).bottomTabs)||[];if(!bt.length)return;const map={HOME:'/',MOVIE:'/id/newWeb/movie',TV:'/id/newWeb/tv-series'};TABS=bt.slice(0,5).map(t=>({t:t.name,i:(t.btTabCode==='HOME'?'🏠':t.btTabCode==='MOVIE'?'🎬':t.btTabCode==='TV'?'📺':'📖'),href:map[t.btTabCode]||'/'}));if(!TABS.some(t=>t.t.toLowerCase().indexOf('novel')>=0))TABS.push({t:'Novel',i:'📖',href:'/id/novel'});renderTabs();}catch(e){}}
function markNav(href){document.querySelectorAll('.pc-nav-item').forEach(a=>a.classList.toggle('active',a.dataset.href===href));document.querySelectorAll('#mTabs button').forEach((b,ix)=>b.classList.toggle('on',TABS[ix]&&TABS[ix].href===href));}
function go(href){if(!href)return;if(href.indexOf('http')===0){window.open(href,'_blank');return;}try{history.pushState({},'',href);}catch(e){}route();try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);}}
window.addEventListener('popstate',route);
function focusSearch(){const sb=$('searchBox');if(sb)sb.scrollIntoView({behavior:'smooth',block:'center'});const q=$('q');if(q)q.focus();}
function route(){
 const p=location.pathname,q=new URLSearchParams(location.search);
 const full=p+(location.search||'');
 markNav(p==='/'?'/':p);
 if($('suggest'))$('suggest').className='suggest';
 if(/moviesDetail/i.test(p)){openDetailSlug(decodeURIComponent(p.split('/').pop().split('?')[0]),q.get('id')||'');}
 else if(p.indexOf('/detail/')>=0){openDetailSlug(decodeURIComponent(p.split('/').pop()),'');}
 else if(p.indexOf('/movieFilter')>=0){showFilterFromQuery(q);}
 else if(p.indexOf('/search')>=0){const kw=q.get('query')||q.get('q')||q.get('keyword')||'';$('q').value=kw;doSearch(kw);}
 else if(p.indexOf('/newWeb/movie')>=0||p.indexOf('/web/movie')>=0){showFilterPage({tabId:2,title:'Film',sort:'Hottest'});}
 else if(p.indexOf('/newWeb/tv-series')>=0||p.indexOf('/web/tv-series')>=0){showFilterPage({tabId:5,title:'Acara TV',sort:'Hottest'});}
 else if(p.indexOf('/newWeb/animated-series')>=0||p.indexOf('/animated')>=0){showFilterPage({tabId:5,title:'Animasi',genre:'Anime',sort:'Hottest'});}
 else if(p.indexOf('/newWeb/')>=0||p.indexOf('/web/')>=0){showFilterPage({tabId:5,title:'Jelajah',sort:'Hottest'});}
 else if(p.indexOf('/ranking-list')>=0){showRanking(q.get('id')||'',q.get('title')||'');}
 else if(p.indexOf('/upcoming')>=0){showUpcoming();}
 else if(p.indexOf('/platform')>=0){const parts=p.split('/').filter(Boolean);showPlatform(decodeURIComponent(parts[parts.length-1]||'Netflix'));}
 else if(p.indexOf('/actor')>=0){showActor(q.get('staffId')||q.get('id')||p.split('/').pop());}
 else if(p.indexOf('/tab/')>=0){showTab(q.get('tabId')||p.split('/').pop());}
 else if(p.indexOf('/trending')>=0){showTrending();}
 else if(p.indexOf('/favorites')>=0){showFavorites();}
 else if(p.indexOf('/download-app')>=0){showApp();}
 else if(p.indexOf('/old-moviebox')>=0){showOld();}
 else if(p.indexOf('/novel')>=0){showNovel();}
 else if(p.indexOf('/live/')>=0){showLive();}
 else showHome();
}
function showOnly(w){$('view-home').style.display=w==='home'?'':'none';$('view-detail').style.display=w==='detail'?'':'none';$('view-list').style.display=w==='list'?'':'none';}
function showHome(){showOnly('home');renderRows(DATA);}
/* ---------- home widgets ---------- */
function renderFilters(){$('filters').innerHTML='<button class="active" onclick="filterSec(\'SEMUA\',this)">Semua</button>'+DATA.filter(o=>o.subjects&&o.subjects.length).map(o=>'<button onclick="filterSec(\''+esc(o.title).replace(/'/g,"\\'")+'\',this)">'+esc(o.title)+'</button>').join('');}
function filterSec(t,btn){document.querySelectorAll('#filters button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');showOnly('home');renderRows(t==='SEMUA'?DATA:DATA.filter(o=>o.title===t));}
function renderHero(){
 if(!BANNER.length)return;
 $('hero').innerHTML='<div class="b-track" id="bTrack">'+BANNER.map((it,i)=>'<div class="b-slide" onclick="go(\''+esc(slugUrl(it))+'\')"><img class="bg" src="'+esc(it.image||it.cover||'')+'"'+(i<2?'':' loading="lazy"')+' onerror="this.style.display=\'none\'"><div class="b-vig"></div><div class="b-mask-s"></div><div class="b-mask-b"></div><div class="b-info"><div><span class="badge">🔥 Banner '+(i+1)+'</span><h1>'+esc(it.title)+'</h1><div class="meta">'+esc(it.genre||'')+' • '+esc(it.country||'')+' • ⭐ '+esc(it.rating||'-')+'</div><div style="color:#ccc;font-size:13px;max-width:560px">'+esc((it.desc||'').slice(0,160))+'</div><button class="btn" onclick="event.stopPropagation();go(\''+esc(slugUrl(it))+'\')">▶ Tonton</button> <button class="btn ghost" onclick="event.stopPropagation();trailerModal(\''+esc(it.subjectId)+'\')">Trailer</button></div></div></div>').join('')+'</div><div class="b-arrow l" onclick="event.stopPropagation();goHero(curHero-1)">‹</div><div class="b-arrow r" onclick="event.stopPropagation();goHero(curHero+1)">›</div><div class="b-dots">'+BANNER.map((_,i)=>'<i class="'+(i===0?'on':'')+'" onclick="goHero('+i+')"></i>').join('')+'</div>';
}
function goHero(i){const n=BANNER.length;if(!n)return;curHero=((i%n)+n)%n;const t=$('bTrack');if(t)t.style.transform='translateX(-'+(curHero*100)+'%)';document.querySelectorAll('.b-dots i').forEach((d,k)=>d.classList.toggle('on',k===curHero));}
function autoHero(){clearInterval(heroTimer);heroTimer=setInterval(()=>goHero(curHero+1),4500);}
function cardHTML(s){
 return '<a class="movie-card" href="'+esc(slugUrl(s))+'" title="'+esc(s.title)+'" onclick="go(\''+esc(slugUrl(s))+'\');return false"><div class="poster"><img loading="lazy" src="'+esc(coverOf(s))+'" onerror="this.src=\''+FALLBACK_IMG+'\'"></div><div class="cap"><p>'+esc(s.title)+'</p><span>⭐ '+esc(s.rating||'-')+'</span></div></a>';
}
function renderRows(ops){
 showOnly('home');
 $('rows').innerHTML=ops.filter(o=>o.subjects&&o.subjects.length).map(o=>'<section class="row"><div class="row-head"><h2>'+esc(o.title)+' <small>('+o.subjects.length+')</small></h2><span class="row-more" onclick="showSection(\''+esc(o.title).replace(/'/g,"\\'")+'\')">Lihat ›</span></div><div class="scroller">'+o.subjects.map(cardHTML).join('')+'</div></section>').join('');
 $('count').textContent='Menampilkan '+ops.reduce((a,o)=>a+(o.subjects||[]).length,0)+' judul';
}
function renderCat(){
 if(!FILTERS.length||!$('catRow'))return;
 $('catRow').innerHTML='<section class="row"><div class="row-head"><h2>Kategori</h2><span class="row-more" onclick="showFilterPage({tabId:5,title:\'Semua\'})">Semua ›</span></div><div class="cat-row">'+FILTERS.map(f=>{const qq=parseFilterQuery(f.query);const href='/id/movieFilter?title='+encodeURIComponent(f.title)+'&tabId='+encodeURIComponent(qq.tabId||5)+'&filterType='+encodeURIComponent(JSON.stringify(qq.ft||{}));return '<a class="cat-card" href="'+esc(href)+'" onclick="go(\''+esc(href)+'\');return false"><img loading="lazy" src="'+esc(f.image||'')+'" onerror="this.src=\''+FALLBACK_IMG+'\'"><span>'+esc(f.title)+'</span></a>';}).join('')+'</div></section>';
}
function parseFilterQuery(q){
 // "type=/home/movieFilter&tabId=5&filterType={...}" (Short Tv double-escaped)
 const out={tabId:5,ft:{}};if(!q)return out;
 try{
  const parts=q.split('&');
  parts.forEach(p=>{const ix=p.indexOf('=');if(ix<0)return;const k=p.slice(0,ix),v=p.slice(ix+1);
   if(k==='tabId')out.tabId=Number(v)||5;
   else if(k==='filterType'){let s=v;try{out.ft=JSON.parse(s);}catch(e){try{out.ft=JSON.parse(s.replace(/\\"/g,'"'));}catch(e2){out.ft={};}} }
  });
 }catch(e){}
 return out;
}
async function loadHot(){
 try{
  const j=await apiGet('/api/everyone');const arr=((j.data||{}).everyoneSearch)||[];
  if(arr.length&&$('hotRow')){$('hotRow').innerHTML='<span class="hot-label">🔥 Lagi dicari:</span>'+arr.slice(0,8).map(x=>'<button onclick="setQ(\''+esc(x.title).replace(/'/g,"\\'")+'\')">'+esc(x.title)+'</button>').join('');}
 }catch(e){}
}
/* ---------- generic list pages ---------- */
function pageShell(title,sub,inner){
 return '<div style="max-width:1280px;margin:auto;padding:16px"><button class="btn dark" onclick="go(\'/\')">‹ Beranda</button><h2 style="margin:14px 0">'+title+(sub?' <small style="color:#888;font-weight:400">'+sub+'</small>':'')+'</h2>'+inner+'</div>';
}
function showSection(title){
 const op=DATA.find(o=>o.title===title);if(!op)return;showOnly('list');
 $('view-list').innerHTML=pageShell(esc(title)+' ('+op.subjects.length+')','', '<div class="grid">'+op.subjects.map(cardHTML).join('')+'</div>');
 window.scrollTo(0,0);
}
function showList(kind,label){
 showOnly('list');let items=[],desc='';
 if(kind==='movie'){items=ALL.filter(s=>s.subjectType==1);desc='subjectType=1';}
 else if(kind==='tv'){items=ALL.filter(s=>s.subjectType==2);desc='subjectType=2 (series/short)';}
 else if(kind==='anime'){items=ALL.filter(s=>/anim|anime/i.test(s.genre||''));desc='genre Anime';}
 else if(kind==='upcoming'){const op=DATA.find(o=>/mendatang/i.test(o.title));items=op?op.subjects:[];desc='APPOINTMENT_LIST';}
 $('view-list').innerHTML=pageShell(esc(label)+' ('+items.length+')',esc(desc),'<div class="grid">'+(items.map(cardHTML).join('')||'<p style="color:#888">Kosong.</p>')+'</div>');
 $('count').textContent=label+': '+items.length+' judul';window.scrollTo(0,0);
}
async function showRanking(opId,title){
 showOnly('list');
 const withTitles=DATA.filter(o=>o.subjects&&o.subjects.length);
 let id=opId||'',t=title||'';
 if(!id&&t){const op=DATA.find(o=>o.title===t);if(op){id=op.genreTopId||op.opId;}}
 if(!id){
  const top=ALL.slice().sort((a,b)=>parseFloat(b.rating||0)-parseFloat(a.rating||0)).slice(0,60);
  $('view-list').innerHTML=pageShell('🏆 Paling Banyak Ditonton <small style="color:#888">(Top 60 lokal — pilih list live)</small>','',
   '<div class="grid">'+top.map(cardHTML).join('')+'</div><h3 style="margin:18px 0 8px">List live (opId asli)</h3><div>'+withTitles.filter(o=>o.opId).map(o=>'<button class="btn dark" style="margin:0 6px 6px 0" onclick="go(\'/id/ranking-list?id='+o.opId+'&title='+encodeURIComponent(o.title)+'\')">'+esc(o.title)+'</button>').join('')+'</div>');
  window.scrollTo(0,0);return;
 }
 $('view-list').innerHTML=pageShell('🏆 '+(esc(t)||'Ranking'),'loading live…','<p style="color:#888">loading /api/ranking…</p>');window.scrollTo(0,0);
 try{
  const j=await apiGet('/api/ranking?id='+encodeURIComponent(id)+'&page=1&perPage=18');
  const d=j.data||{};const items=(d.subjectList||d.items||[]).map(s=>normApi(s));
  $('view-list').innerHTML=pageShell('🏆 '+esc(d.title||t||'Ranking')+' ('+items.length+')','live /api/ranking',
   '<div class="grid">'+(items.map(cardHTML).join('')||'<p style="color:#888">Kosong.</p>')+'</div><div style="margin-top:12px"><button class="btn dark" onclick="showRanking(\'\',\'\')">‹ Semua ranking</button></div>');
 }catch(e){$('view-list').innerHTML=pageShell('Ranking','gagal live: '+esc(e),'<button class="btn dark" onclick="showRanking(\'\',\'\')">‹ Kembali</button>');}
}
async function showUpcoming(){
 showOnly('list');$('view-list').innerHTML=pageShell('🗓️ Mendatang','loading live…','<p style="color:#888">loading /api/upcoming…</p>');window.scrollTo(0,0);
 let live=[];
 try{const j=await apiGet('/api/upcoming?page=1&perPage=18');live=(((j.data||{}).subjects)||[]).map(s=>normApi(s));}catch(e){}
 const op=DATA.find(o=>/mendatang/i.test(o.title));const local=op?op.subjects:[];
 const items=live.length?live:local;
 $('view-list').innerHTML=pageShell('🗓️ Mendatang ('+items.length+')',live.length?'live /api/upcoming':'lokal (live kosong)',
  '<div class="grid">'+(items.map(cardHTML).join('')||'<p style="color:#888">Kosong.</p>')+'</div>');
 $('count').textContent='Mendatang: '+items.length+' judul';
}
async function showTrending(){
 showOnly('list');$('view-list').innerHTML=pageShell('🔥 Trending','loading…','<p style="color:#888">loading /api/trending…</p>');window.scrollTo(0,0);
 try{const j=await apiGet('/api/trending?page=1&perPage=18');const items=(((j.data||{}).subjectList)||[]).map(s=>normApi(s));
  $('view-list').innerHTML=pageShell('🔥 Trending ('+items.length+')','live /api/trending','<div class="grid">'+items.map(cardHTML).join('')+'</div>');
 }catch(e){showList('tv','Trending (fallback lokal)');}
}
async function showTab(tabId){
 showOnly('list');$('view-list').innerHTML=pageShell('🗂️ Tab '+esc(tabId),'loading…','<p style="color:#888">loading /api/tab…</p>');window.scrollTo(0,0);
 try{const j=await apiGet('/api/tab?tabId='+encodeURIComponent(tabId));const ops=((j.data||{}).operatingList)||[];
  let html='';
  ops.forEach(o=>{const items=((o.subjects||[]).map(s=>normApi(s)));if(items.length)html+='<h3 style="margin:16px 0 8px">'+esc(o.title||'')+'</h3><div class="grid">'+items.map(cardHTML).join('')+'</div>';});
  $('view-list').innerHTML=pageShell('🗂️ Tab '+esc(tabId),ops.length+' section',html||'<p style="color:#888">Kosong.</p>');
 }catch(e){$('view-list').innerHTML=pageShell('Tab','gagal: '+esc(e),'<button class="btn dark" onclick="go(\'/\')">‹ Beranda</button>');}
}
async function showPlatform(name){
 showOnly('list');$('view-list').innerHTML=pageShell('🖥️ '+esc(name),'loading…','<p style="color:#888">loading /api/platform…</p>');window.scrollTo(0,0);
 const plats=['Netflix','Disney','PrimeVideo','AppleTV','Viu','Hulu','Vivamax','HBO','Zee5','Hoichoi'];
 try{
  const j=await apiGet('/api/platform?platform='+encodeURIComponent(name)+'&page=1&perPage=18');
  const d=j.data||{};const items=((d.subjectList||d.items||d.pager&&[])||[]).map(s=>normApi(s));
  const list=(d.platformList||[]).map(p=>p.name||p).filter(Boolean);
  const tabs=(list.length?list:plats).map(p=>'<button class="'+(p===name?'btn':'btn dark')+'" style="margin:0 6px 6px 0" onclick="go(\'/id/platform/'+encodeURIComponent(p)+'\')">'+esc(p)+'</button>').join('');
  $('view-list').innerHTML=pageShell('🖥️ '+esc(name)+' ('+items.length+')','live /api/platform','<div>'+tabs+'</div><div class="grid">'+(items.map(cardHTML).join('')||'<p style="color:#888">Kosong — coba platform lain.</p>')+'</div>');
 }catch(e){$('view-list').innerHTML=pageShell('🖥️ '+esc(name),'gagal live: '+esc(e),'<div>'+plats.map(p=>'<button class="btn dark" style="margin:0 6px 6px 0" onclick="go(\'/id/platform/'+p+'\')">'+p+'</button>').join('')+'</div>');}
}
async function showActor(staffId){
 showOnly('list');if(!staffId){$('view-list').innerHTML=pageShell('Aktor','','<p style="color:#888">staffId kosong.</p>');return;}
 $('view-list').innerHTML=pageShell('🎭 Aktor','loading…','<p style="color:#888">loading /api/staff…</p>');window.scrollTo(0,0);
 try{
  const j=await apiGet('/api/staff?staffId='+encodeURIComponent(staffId));const d=(j.data||{});
  const list=(((d.list||{}).data||d.list||{}).subjectList||((d.list||{}).data||{}).items||d.subjects||[]);
  const rel=d.related||{};
  const items=list.map(s=>normApi(s));
  $('view-list').innerHTML=pageShell('🎭 '+(esc((rel&&rel.name)||'Filmografi'))+' ('+items.length+')','live /api/staff','<div class="grid">'+(items.map(cardHTML).join('')||'<p style="color:#888">Kosong.</p>')+'</div>');
 }catch(e){$('view-list').innerHTML=pageShell('Aktor','gagal: '+esc(e),'<button class="btn dark" onclick="go(\'/\')">‹ Beranda</button>');}
}
/* ---------- filter penuh (movieFilter) ---------- */
function showFilterFromQuery(q){
 const tabId=Number(q.get('tabId')||5);
 let ft={};try{ft=JSON.parse(q.get('filterType')||'{}');}catch(e){ft={};}
 showFilterPage({tabId:tabId,title:q.get('title')||'Filter',country:ft.country||'All',genre:ft.genre||'All',sort:ft.sort||'Hottest',year:ft.year||'All',classify:ft.classify||'All'});
}
function showFilterPage(o){
 curFilter=Object.assign({page:1,perPage:18,country:'All',genre:'All',sort:'Hottest',year:'All',classify:'All',title:'Filter',tabId:5},o||{});
 showOnly('list');renderFilterUI();loadFilter(false);window.scrollTo(0,0);
}
function opt(v,cur){return '<option value="'+esc(v)+'"'+(String(v)===String(cur)?' selected':'')+'>'+esc(v)+'</option>';}
function renderFilterUI(){
 const f=curFilter;
 const countries=['All','Indonesia','Korea','China','Japan','Thailand','United States','United Kingdom','India','Hong Kong','Taiwan','Malaysia','Philippines','Vietnam','Singapore'];
 const genres=['All','Romance','Drama','Comedy','Action','Thriller','Horror','Fantasy','Sci-Fi','Animation','Adventure','Mystery','Crime','War','History','Musical','Documentary','Family','Anime'];
 const sorts=['Hottest','Newest','Most Viewed','Average Rating'];
 const years=['All','2026','2025','2024','2023','2022','2021','2020'];
 const isMovie=(Number(f.tabId)===2);
 $('view-list').innerHTML='<div style="max-width:1280px;margin:auto;padding:16px"><button class="btn dark" onclick="go(\'/\')">‹ Beranda</button>'+
  '<h2 style="margin:14px 0">🎛️ '+esc(f.title)+' <small style="color:#888;font-weight:400">tabId '+esc(String(f.tabId))+' · live /api/filter</small></h2>'+
  '<div class="filter-bar">'+
  '<label>Negara<select id="fCountry">'+countries.map(c=>opt(c,f.country)).join('')+'</select></label>'+
  '<label>Genre<select id="fGenre">'+genres.map(c=>opt(c,f.genre)).join('')+'</select></label>'+
  (isMovie?'<label>Klasifikasi<select id="fClassify">'+['All','Indonesia','Foreign'].map(c=>opt(c,f.classify)).join('')+'</select></label>':'')+
  '<label>Urut<select id="fSort">'+sorts.map(c=>opt(c,f.sort)).join('')+'</select></label>'+
  '<label>Tahun<select id="fYear">'+years.map(c=>opt(c,f.year)).join('')+'</select></label>'+
  '<button class="btn" onclick="applyFilterUI()">Terapkan</button></div>'+
  '<div id="fGrid"><p style="color:#888">loading…</p></div><div style="text-align:center;margin:16px 0"><button class="btn dark" id="fMore" onclick="loadFilter(true)">Muat lagi ›</button></div></div>';
}
function applyFilterUI(){
 curFilter.country=$('fCountry')?$('fCountry').value:'All';
 curFilter.genre=$('fGenre')?$('fGenre').value:'All';
 curFilter.sort=$('fSort')?$('fSort').value:'Hottest';
 curFilter.year=$('fYear')?$('fYear').value:'All';
 curFilter.classify=$('fClassify')?$('fClassify').value:'All';
 curFilter.page=1;loadFilter(false);
}
async function loadFilter(more){
 const f=curFilter;if(more)f.page++;else f.page=f.page||1;
 const grid=$('fGrid');if(!more&&grid)grid.innerHTML='<p style="color:#888">loading /api/filter…</p>';
 const body={page:f.page,perPage:f.perPage||18,tabId:Number(f.tabId)};
 if(f.country&&f.country!=='All')body.country=f.country;
 if(f.genre&&f.genre!=='All')body.genre=f.genre;
 if(f.sort)body.sort=f.sort;
 if(f.year&&f.year!=='All')body.year=f.year;
 if(Number(f.tabId)===2&&f.classify&&f.classify!=='All')body.classify=f.classify;
 try{
  const j=await apiPost('/api/filter',body);
  const d=j.data||{};const items=((d.items||d.subjectList||[]).map(s=>normApi(s)));
  const html='<div class="grid">'+items.map(cardHTML).join('')+'</div>';
  if(!more){grid.innerHTML=html||'<p style="color:#888">Kosong.</p>';}
  else{const tmp=document.createElement('div');tmp.innerHTML=html;const g=grid.querySelector('.grid');if(g)g.insertAdjacentHTML('beforeend',tmp.querySelector('.grid').innerHTML);else grid.innerHTML+=html;}
  const mb=$('fMore');if(mb)mb.style.display=((d.pager&&d.pager.hasMore)||items.length>=(f.perPage||18))?'':'none';
  $('count').textContent=f.title+': hal '+f.page+' ('+items.length+' judul)';
 }catch(e){if(grid)grid.innerHTML='<p style="color:orange">Gagal /api/filter — '+esc(e)+'</p>';}
}
/* ---------- misc pages ---------- */
function showApp(){
 showOnly('list');
 $('view-list').innerHTML=pageShell('📲 Aplikasi MovieBox','<span id="apkLive">cek versi…</span>','<p style="color:#ccc">APK resmi (dari API app/get-latest-app-pkgs):</p><p style="margin:14px 0"><a class="btn" id="apkBtn" href="https://h5-api.aoneroom.com/pkg/redirect?a=moviebox&p=com.community.oneroom&c=100&n=web_apk_cafe" target="_blank">⬇ Download APK</a></p>');
 apiGet('/api/app?appName=moviebox').then(j=>{try{const arr=(j.data&&j.data.pkgs)||j.data||[];const it=Array.isArray(arr)?arr[0]:(arr.pkgs||[])[0];const url=(it&&(it.url||it.downloadUrl))||'';if(url){$('apkBtn').href=url;$('apkLive').textContent='versi live ketemu ✔';}else{$('apkLive').textContent='pakai link default';}}catch(e){}}).catch(e=>{const el=$('apkLive');if(el)el.textContent='offline — pakai link default';});
 window.scrollTo(0,0);
}
function showOld(){showOnly('list');$('view-list').innerHTML=pageShell('📼 Old Moviebox','','<p style="color:#888">Arsip tampilan lama — buka versi asli:</p><p style="margin:12px 0"><a class="btn" href="https://themoviebox.org/id/old-moviebox" target="_blank">↗ Buka Old Moviebox asli</a></p>');window.scrollTo(0,0);}
function showNovel(){showOnly('list');$('view-list').innerHTML=pageShell('📖 Novel','','<p style="color:#888">Tab Novel asli redirect ke H5 novel — tidak ada di scrape homepage.</p><p style="margin:12px 0"><a class="btn dark" href="https://themoviebox.org/id" target="_blank">↗ Cek web asli</a></p>');window.scrollTo(0,0);}
function showLive(){showOnly('list');$('view-list').innerHTML=pageShell('⚽ Siaran Olahraga','SPORT_LIVE kosong di scrape (liveList=[])','<p style="color:#888">Aslinya butuh login + HLS live. Link resmi sportsnow (dari home API):</p><p style="margin:12px 0"><a class="btn" href="https://sportsnow.top/live?tab=live&sportType=football" target="_blank">↗ Buka live asli</a></p>');window.scrollTo(0,0);}
/* ---------- favorites + login ---------- */
function getFavs(){return favs;}
function isFav(id){return favs.some(f=>String(f.subjectId)===String(id));}
function toggleFav(item){
 const ix=favs.findIndex(f=>String(f.subjectId)===String(item.subjectId));
 if(ix>=0)favs.splice(ix,1);else favs.push({title:item.title,subjectId:String(item.subjectId),detailPath:item.detailPath||'',cover:item.cover||'',rating:item.rating||''});
 try{localStorage.setItem('mb_favs',JSON.stringify(favs));}catch(e){}
 updateFavCount();renderFavBtn();
}
function updateFavCount(){const el=$('favCount');if(el)el.textContent=String(favs.length);}
function renderFavBtn(){const el=$('favToggle');if(el&&curDetail)el.innerHTML=isFav(curDetail.subjectId)?'♥ Hapus favorit':'♡ Favorit';}
function showFavorites(){
 showOnly('list');updateFavCount();
 $('view-list').innerHTML=pageShell('♥ Favoritku ('+favs.length+')','tersimpan lokal (localStorage)',
  favs.length?'<div class="grid">'+favs.map(cardHTML).join('')+'</div><div style="margin-top:12px"><button class="btn dark" onclick="clearFavs()">Hapus semua</button></div>':'<p style="color:#888">Belum ada favorit — klik ♡ di halaman detail.</p>');
 window.scrollTo(0,0);
}
function clearFavs(){favs=[];try{localStorage.removeItem('mb_favs');}catch(e){}updateFavCount();showFavorites();}
function openLogin(){
 const cur=getToken();
 $('modalCard').innerHTML='<div style="padding:22px;max-width:520px"><div style="display:flex;justify-content:space-between;align-items:center"><b>🔑 Login token (mb_token)</b><button onclick="closeModal()" style="background:#333;color:#fff;border:0;border-radius:8px;padding:6px 12px;cursor:pointer">✕</button></div>'+
 '<p style="color:#888;font-size:13px;margin:10px 0">Stream asli (/api/play) butuh <code>Authorization: Bearer mb_token</code> — ambil dari cookie <code>mb_token</code> setelah login di themoviebox.org, lalu tempel di sini. Token tersimpan lokal & dikirim sebagai <code>X-Mb-Token</code>.</p>'+
 '<input id="tokIn" placeholder="tempel mb_token…" value="'+esc(cur)+'" style="width:100%;background:#111;border:1px solid #333;color:#fff;border-radius:10px;padding:12px">'+
 '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" onclick="saveToken()">Simpan</button><button class="btn dark" onclick="logoutToken()">Logout</button><a class="btn ghost" href="https://themoviebox.org/id" target="_blank">↗ Login di web asli</a></div>'+
 '<div id="tokStat" style="font-size:12px;color:#888;margin-top:8px">'+(cur?'● token tersimpan ('+cur.length+' char)':'○ belum ada token (mode anon)')+'</div></div>';
 $('modal').style.display='block';
}
function saveToken(){const v=($('tokIn')||{}).value||'';try{localStorage.setItem('mb_token',v.trim());}catch(e){}closeModal();pingAPI();}
function logoutToken(){try{localStorage.removeItem('mb_token');}catch(e){}closeModal();pingAPI();}
function closeModal(){$('modal').style.display='none';}
/* ---------- search ---------- */
let sugT=null;
document.getElementById('q').addEventListener('input',()=>{clearTimeout(sugT);const v=$('q').value.trim();if(!v){$('suggest').className='suggest';return;}sugT=setTimeout(()=>liveSuggest(v),300);});
document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
document.addEventListener('click',e=>{const sb=$('searchBox');if(sb&&!sb.contains(e.target))$('suggest').className='suggest';});
async function liveSuggest(kw){
 let names=[];
 try{const j=await apiPost('/api/suggest',{keyword:kw,perPage:8});names=(((j.data||{}).items)||[]).map(x=>x.word).filter(Boolean);}catch(e){}
 const local=ALL.filter(s=>(s.title||'').toLowerCase().indexOf(kw.toLowerCase())>=0).slice(0,6);
 const box=$('suggest');
 box.innerHTML=names.map(w=>'<div onclick="setQ(\''+esc(w).replace(/'/g,"\\'")+'\')">🔍 '+esc(w)+' <small style="color:#888">live</small></div>').join('')+
  local.map(s=>'<div onclick="go(\''+esc(slugUrl(s))+'\')">🎬 '+esc(s.title)+' <small style="color:#888">'+esc(s.section||'')+'</small></div>').join('')||'<div style="color:#888">Ga ketemu.</div>';
 box.className='suggest on';
}
function setQ(w){$('q').value=w;$('suggest').className='suggest';doSearch(w);}
async function doSearch(preset){
 const q=((preset!=null?preset:$('q').value)||'').toLowerCase().trim();$('suggest').className='suggest';
 if(!q){renderRows(DATA);return;}
 try{history.replaceState({},'', '/id/search?query='+encodeURIComponent(q));}catch(e){}
 showOnly('list');
 $('view-list').innerHTML=pageShell('Hasil cari "'+esc(q)+'"','nyari lokal + live…','<p style="color:#888">…</p>');
 const local=ALL.filter(s=>((s.title||'')+' '+(s.genre||'')+' '+(s.country||'')+' '+(s.section||'')).toLowerCase().indexOf(q)>=0);
 let live=[];
 try{const j=await apiPost('/api/search',{keyword:q,page:1,perPage:18});live=(((j.data||{}).items)||((j.data||{}).subjects)||[]).map(s=>normApi(s));}catch(e){}
 const seen={};local.forEach(s=>seen[String(s.subjectId)]=1);
 live.forEach(s=>{if(!seen[String(s.subjectId)])local.push(s);});
 $('view-list').innerHTML=pageShell('Hasil cari "'+esc(q)+'" ('+local.length+')','lokal+live','<div class="grid">'+(local.map(cardHTML).join('')||'<p style="color:#888">Ga ketemu.</p>')+'</div>');
 $('count').textContent='Hasil cari: '+local.length+' judul';window.scrollTo(0,0);
}
/* ---------- detail ---------- */
function findLocal(slugOrId){return ALL.find(s=>s.detailPath===slugOrId||String(s.subjectId)===String(slugOrId))||BANNER.find(b=>b.detailPath===slugOrId||String(b.subjectId)===String(slugOrId));}
async function openDetailSlug(slug,qid){
 let local=findLocal(slug);
 if(!local&&!/^\d+$/.test(slug||'')&&!qid){showHome();return;}
 showOnly('detail');
 const id=(local&&local.subjectId)||qid||slug;
 $('view-detail').innerHTML='<div style="max-width:1100px;margin:auto;padding:40px 16px;color:#888">Loading detail '+esc(id)+'… (API /api/detail)</div>';
 window.scrollTo(0,0);
 let api=null;
 try{const j=await apiGet('/api/detail?subjectId='+encodeURIComponent(id));api=j.data||j;}catch(e){}
 if(!local&&api&&api.subject){local=normApi(api.subject);}
 if(!local){$('view-detail').innerHTML=pageShell('Not found','','<p style="color:#888">ID/slug ga ketemu.</p>');showOnly('list');$('view-list').innerHTML=$('view-detail').innerHTML;return;}
 renderDetail(local,api);
}
function renderDetail(local,api){
 const s=(api&&api.subject)||{};
 const stars=(api&&api.stars)||[];
 const merged={
  title:s.title||(local&&local.title)||'-',
  genre:s.genre||(local&&local.genre)||'-',
  country:s.countryName||(local&&local.country)||'-',
  date:s.releaseDate||(local&&local.date)||'-',
  rating:s.imdbRatingValue||(local&&local.rating)||'-',
  subjectId:String(s.subjectId||(local&&local.subjectId)||''),
  detailPath:s.detailPath||(local&&local.detailPath)||'',
  cover:((s.cover||{}).url)||coverOf(local||{})||'',
  desc:s.description||(local&&local.desc)||'',
  subjectType:s.subjectType||(local&&local.subjectType)||'',
  duration:s.duration||(local&&local.duration)||0,
  trailer:(((s.trailer||{}).videoAddress||{}).url)||(local&&local.trailer)||'',
  stills:s.stills||[],
  corner:s.corner||'',appt:s.appointmentCnt||0,apptDate:s.appointmentDate||''
 };
 curDetail=merged;curSe=1;curEp=1;
 const res=(api||{}).resource||{};
 curSeasonList=res.seasons||[];
 const bd=BANNER.find(b=>String(b.subjectId)===merged.subjectId);
 const bg=(bd&&bd.image)||merged.cover;
 const castHtml=stars.length?'<div class="cast-row">'+stars.slice(0,12).map(c=>'<a class="cast-card" href="/id/actor/detail?staffId='+encodeURIComponent(c.staffId||'')+'" onclick="go(\'/id/actor/detail?staffId='+encodeURIComponent(c.staffId||'')+'\');return false"><b>'+esc(c.name||'')+'</b><span>'+esc(c.character||'')+'</span></a>').join('')+'</div>':'';
 const stillsHtml=(merged.stills&&merged.stills.length)?'<h3 style="margin:18px 0 8px">📸 Stills ('+merged.stills.length+')</h3><div class="stills-row">'+merged.stills.slice(0,10).map(st=>'<img loading="lazy" src="'+esc((st&&st.url)||st||'')+'" onerror="this.style.display=\'none\'">').join('')+'</div>':'';
 let seasonHtml='';
 if(curSeasonList.length){
  seasonHtml='<div class="season-bar" id="seasonBar">'+curSeasonList.map((se,ix)=>'<button class="'+(ix===0?'on':'')+'" data-ix="'+ix+'" onclick="selSeason('+ix+')">S'+se.se+' ('+se.maxEp+' eps)</button>').join('')+'</div><div class="eps" id="eps"></div><div class="ep-pager" id="epPager"></div><div style="font-size:11px;color:#888" id="resInfo"></div>';
 }else{
  seasonHtml='<div style="font-size:12px;color:#888">Film (tanpa episode) — klik Putar. Stream asli butuh login/VIP, biasanya kosong untuk anon.</div><div class="eps"><button onclick="playEp(\'\',\'\')">▶ Putar film</button></div>';
 }
 $('view-detail').innerHTML=
  '<div class="d-back"><img src="'+esc(bg)+'" onerror="this.style.display=\'none\'"><div class="b-mask-b"></div></div>'+
  '<div class="d-wrap"><img class="d-poster" src="'+esc(merged.cover)+'" onerror="this.src=\''+FALLBACK_IMG+'\'">'+
  '<div class="d-info"><button class="btn dark" onclick="go(\'/\')">‹ Beranda</button>'+
  '<h1>'+esc(merged.title)+'</h1>'+
  '<div class="meta">⭐ '+esc(merged.rating)+' • '+esc(merged.genre)+' • '+esc(merged.country)+' • '+esc(merged.date)+'</div>'+
  '<div class="pills"><span>ID: '+esc(merged.subjectId)+'</span><span>type: '+esc(String(merged.subjectType))+'</span>'+
  (merged.duration?'<span>⏱ '+Math.round(merged.duration/60)+' mnt</span>':'')+
  (res.source?'<span>src: '+esc(res.source)+'</span>':'')+(res.uploadBy?'<span>by '+esc(res.uploadBy)+'</span>':'')+
  (merged.corner?'<span>'+esc(merged.corner)+'</span>':'')+(merged.appt?'<span>📅 '+esc(String(merged.appt))+'</span>':'')+'</div>'+
  '<p class="desc">'+esc(merged.desc||'Sinopsis kosong di homepage scrape — versi live juga kosong untuk judul ini.')+'</p>'+
  castHtml+
  '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
  '<a class="btn" href="'+esc(asliUrl(merged))+'" target="_blank">↗ Buka Asli</a>'+
  '<button class="btn ghost" onclick="trailerModal(\''+esc(merged.subjectId)+'\')">▶ Trailer</button>'+
  '<button class="btn ghost" id="favToggle" onclick="toggleFav(curDetail)">♡ Favorit</button>'+
  '<button class="btn dark" onclick="shareItem()">⤴ Bagikan</button>'+
  '<button class="btn dark" onclick="navigator.clipboard&&navigator.clipboard.writeText(\''+esc(merged.subjectId)+'\');alert(\'ID dicopy\')">Copy ID</button></div>'+
  '<h3 style="margin:18px 0 8px">🎞️ Nonton — pilih episode</h3>'+seasonHtml+'<div id="player"></div>'+
  (merged.trailer?'<h4 style="margin:14px 0 6px">Trailer (macdn)</h4><video class="player" controls preload="none" src="'+esc(merged.trailer)+'" poster="'+esc(merged.cover)+'"></video>':'')+
  stillsHtml+
  '<h3 style="margin:18px 0 8px">💬 Komentar</h3><div id="cmt"><p style="color:#888">loading…</p></div>'+
  '<h3 style="margin:18px 0 8px">Rekomendasi</h3><div id="rec" class="grid"><p style="color:#888">loading…</p></div>'+
  '</div></div>';
 renderFavBtn();
 if(curSeasonList.length)selSeason(0);
 $('count').textContent='Detail: '+merged.title;
 loadRec(merged.subjectId);loadComments(merged.subjectId);
 try{document.title=merged.title+' - MovieBox';}catch(e){}
}
let epPage={ix:0,page:0,per:60};
function selSeason(ix){
 epPage={ix:ix,page:0,per:60};
 document.querySelectorAll('#seasonBar button').forEach(b=>b.classList.toggle('on',Number(b.dataset.ix)===ix));
 renderEps();
}
function renderEps(){
 const se=curSeasonList[epPage.ix];if(!se)return;
 const total=se.maxEp||1,pages=Math.ceil(total/epPage.per);
 const start=epPage.page*epPage.per+1,end=Math.min(total,(epPage.page+1)*epPage.per);
 let b='';
 for(let k=start;k<=end;k++)b+='<button onclick="playEp('+se.se+','+k+')" data-se="'+se.se+'" data-ep="'+k+'">E'+k+'</button>';
 $('eps').innerHTML=b;
 const res=(se.resolutions||[]).map(r=>r.resolution+'p:'+r.epNum).join(' · ');
 $('resInfo').textContent='Season S'+se.se+' · eps '+start+'–'+end+'/'+total+' · resolusi: '+res;
 $('epPager').innerHTML=pages>1?'<button class="btn dark small" onclick="epNav(-1)">‹</button><span style="color:#888;font-size:12px">hal '+(epPage.page+1)+'/'+pages+'</span><button class="btn dark small" onclick="epNav(1)">›</button>':'';
}
function epNav(d){const se=curSeasonList[epPage.ix];const pages=Math.ceil((se.maxEp||1)/epPage.per);epPage.page=((epPage.page+d)%pages+pages)%pages;renderEps();}
async function loadRec(id){
 try{
  const j=await apiGet('/api/rec?subjectId='+encodeURIComponent(id)+'&page=1&perPage=12');
  const items=(((j.data||{}).items)||[]).map(s=>normApi(s));
  $('rec').innerHTML=items.map(cardHTML).join('')||'<p style="color:#888">Kosong.</p>';
 }catch(e){
  const rec=ALL.filter(s=>String(s.subjectId)!==String(id)).slice(0,12);
  const el=$('rec');if(el)el.innerHTML=rec.map(cardHTML).join('');
 }
}
async function loadComments(id){
 try{
  const j=await apiGet('/api/comments?id='+encodeURIComponent(id)+'&page=1&perPage=8');
  const items=((j.data||{}).items)||[];
  $('cmt').innerHTML=items.length?items.slice(0,8).map(c=>'<div class="comment"><b>'+esc(c.userName||c.nickName||'User')+'</b><span>'+esc(c.createTime||'')+'</span><p>'+esc(c.content||c.text||'')+'</p></div>').join(''):'<p style="color:#888">Belum ada komentar.</p>';
 }catch(e){const el=$('cmt');if(el)el.innerHTML='<p style="color:#888">Komentar off.</p>';}
}
async function playEp(se,ep){
 curSe=se;curEp=ep;
 document.querySelectorAll('#eps button').forEach(b=>b.classList.toggle('on',b.dataset.se==se&&b.dataset.ep==ep));
 const box=$('player');box.innerHTML='<p style="color:#888">Loading stream… (/api/play)</p>';
 try{
  const j=await apiGet('/api/play?subjectId='+encodeURIComponent(curDetail.subjectId)+'&se='+encodeURIComponent(se)+'&ep='+encodeURIComponent(ep)+'&detailPath='+encodeURIComponent(curDetail.detailPath||''));
  const d=j.data||{};
  const streams=d.streams||[],hls=d.hls||[],dash=d.dash||[];
  if(!streams.length&&!hls.length&&!dash.length){
   box.innerHTML='<div style="background:#22242c;border:1px solid #333;border-radius:12px;padding:14px;font-size:13px">'+
    'Stream kosong (hasResource='+d.hasResource+', freeNum='+(d.freeNum==null?'-':d.freeNum)+'). Wajar untuk anon — aslinya butuh login/VIP/share-unlock. '+(getToken()?'Token sudah dipasang tapi tetap kosong = butuh VIP.':'Coba pasang token via "Login token".')+
    (curDetail.trailer?'<video class="player" controls preload="none" src="'+esc(curDetail.trailer)+'"></video>':'')+
    '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="'+esc(asliUrl(curDetail))+'" target="_blank">↗ Tonton di web asli</a><button class="btn dark" onclick="openLogin()">🔑 Login token</button></div></div>';
   return;
  }
  const hlsUrl=hls[0]?(hls[0].url||hls[0]):'';
  let html='';
  if(hlsUrl){
   html+='<video id="hlsVideo" class="player" controls playsinline></video><div style="font-size:11px;color:#888">HLS'+(hls[0].resolution?' '+esc(hls[0].resolution):'')+' · <a style="color:#2ff58b" href="'+esc(hlsUrl)+'" target="_blank">buka m3u8</a></div>';
  }
  html+=streams.map(s=>'<div style="margin-top:8px;font-size:12px"><b>'+esc(s.resolution||s.definition||'stream')+'</b> — <a style="color:#2ff58b" href="'+esc(s.url)+'" target="_blank">buka mp4</a><video class="player" controls preload="none" src="'+esc(s.url)+'"></video></div>').join('');
  box.innerHTML=html;
  if(hlsUrl&&window.Hls){
   try{
    const v=$('hlsVideo');
    if(v&&Hls.isSupported()){const h=new Hls();h.loadSource(hlsUrl);h.attachMedia(v);v.play().catch(()=>{});}
    else if(v){v.src=hlsUrl;}
   }catch(e){}
  }else if(hlsUrl){const v=$('hlsVideo');if(v)v.src=hlsUrl;}
 }catch(e){box.innerHTML='<p style="color:orange">Gagal fetch /api/play — '+esc(e)+'</p>';}
}
async function shareItem(){
 try{
  const url=location.href;
  const j=await apiPost('/api/share',{url:url,action:'share'});
  const su=((j.data||{}).shareUrl)||url;
  try{await navigator.clipboard.writeText(su);}catch(e){}
  alert('Link share dicopy:\n'+su);
 }catch(e){try{await navigator.clipboard.writeText(location.href);}catch(e2){}alert('Link dicopy.');}
}
function trailerModal(id){
 const s=ALL.find(x=>String(x.subjectId)===String(id))||BANNER.find(x=>String(x.subjectId)===String(id));
 if(!s)return;
 $('modalCard').innerHTML='<div style="padding:20px"><div style="display:flex;justify-content:space-between;align-items:center"><b>'+esc(s.title)+'</b><button onclick="closeModal()" style="background:#333;color:#fff;border:0;border-radius:8px;padding:6px 12px;cursor:pointer">✕</button></div>'+
  (s.trailer?'<video controls autoplay src="'+esc(s.trailer)+'" style="width:100%;border-radius:10px;margin-top:10px;background:#000"></video>':'<p style="color:#888;margin-top:10px">Trailer ga ada.</p>')+
  '<div style="margin-top:10px"><a class="btn" href="'+esc(asliUrl(s))+'" target="_blank">↗ Buka Asli</a></div></div>';
 $('modal').style.display='block';
}
