# MovieBox Clone v3 — 100% (Vercel-ready)

Clone riset `https://themoviebox.org/id` — 34 section, 442 judul, 12 banner, 10 kategori.
Static frontend + **18 Vercel Serverless Function** proxy ke `h5-api.aoneroom.com` (bypass CORS + token).

## Struktur

```
moviebox-clone/
  index.html   — layout: sidebar PC + header search + hot row + banner-pc + kategori + rows + bottom tabs mobile
  style.css    — dark #101114, gradient biru-hijau, filter-bar, season-bar, cast, stills, comments
  app.js       — SPA router (20 route), search+suggest live, filter penuh, detail+cast+stills+eps 180, player HLS, favorites, login token, komentar
  data.json    — hasil scrape 34 section (fallback offline)
  vercel.json  — rewrites (20 route SPA) + CORS + cache
  api/         — 18 endpoint serverless
    _lib.js    — X-Client-Token md5(reverse(unix)), header wajib
    home, detail, play, search, suggest, rec, filter, ranking,
    upcoming, trending, tab, tabs, platform, staff, comments,
    everyone, share, app
```

## Deploy ke Vercel (2 menit)

```bash
cd moviebox-clone
npx vercel --prod
# atau drag-drop folder ini di vercel.com/new
```
Tanpa env / build setting — static + Node serverless otomatis.

Test setelah deploy:
- `/` → homepage (34 section)
- `/id/movieFilter?tabId=5&country=Korea&genre=All&sort=Hottest&year=All` → filter live
- `/id/moviesDetail/bound-by-promise-CZ3PUrzXcW5` → detail + 180 episode
- `/id/platform/Netflix`, `/id/ranking-list`, `/id/upcoming`, `/id/favorites`, `/id/tab/5`
- `/api/home`, `/api/filter` (POST), `/api/detail?subjectId=...`

## Fitur vs asli

| Fitur asli | Clone v3 | Ket |
|---|---|---|
| Sidebar PC + bottom tabs mobile | ✅ | bottom tabs live dari `/api/tabs` |
| Banner fullscreen + panah + dots | ✅ | autoplay 4.5s |
| Row movie-card + kategori + "Lagi dicari" | ✅ | `/api/everyone` + `/api/filter` (10 kategori) |
| Halaman **filter penuh** | ✅ | negara/genre/sort/tahun + paginasi "Muat lagi", live `/api/filter` |
| Ranking list | ✅ | live `/api/ranking` per opId asli + link tiap list |
| Platform (Netflix/Disney/…) | ✅ | live `/api/platform` |
| Upcoming / Trending / Tab | ✅ | live `/api/upcoming`, `/api/trending`, `/api/tab` |
| Search + suggest | ✅ | lokal + live `/api/search` + `/api/suggest` |
| Detail + cast (klik → halaman actor) + stills | ✅ | `/api/detail`, `/api/staff` |
| **Episode 180 + season** + resolusi | ✅ | season bar, pager 60/halaman (bukan 60 max) |
| Trailer mp4 + player HLS | ✅ | hls.js untuk .m3u8, mp4 langsung |
| Komentar | ✅ | `/api/comments` |
| Bagikan / share-link | ✅ | `/api/share` |
| Favorit (localStorage) + counter | ✅ | halaman `/id/favorites` |
| Login token | ✅ | modal simpan `mb_token` → header `X-Mb-Token` |
| Download APK | ✅ | link live `/api/app` |
| SPORT_LIVE / Novel / Old | ⚠️ | benar-benar kosong di upstream → link ke web asli |
| Stream film | ⚠️ | `/api/play` kosong utk anon (butuh login/VIP) — ada tombol "Buka Asli" |

## Catatan jujur

Yang **tidak** bisa 100% di-clone: stream video asli (`subject/play` selalu `hasResource=false` tanpa akun VIP), Siaran Olahraga live, dan Novel — karena memang butuh login/backend khusus di situs asli. Semua endpoint-nya sudah di-proxy, jadi kalau punya `mb_token` valid, `/api/play` ikut memakai token itu.