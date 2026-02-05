# Deploy ke EdgeOne (Tencent Cloud)

## Build

```bash
npm run build
```

Output ada di folder **`dist/`**. Upload isi folder `dist/` ke EdgeOne Pages (Import Git, Direct Upload, atau CI).

## Pengaturan SPA (Single Page Application)

Agar route seperti `/category/nasional` dan `/news-detail` tidak 404:

1. **EdgeOne Console** → Pages → Project → **Settings**
2. Aktifkan **Custom 404** / **Error Page** dan arahkan ke **index.html** (atau set "404 document" = index.html)
3. Atau gunakan aturan **Rewrite**: semua path `/*` → serve `index.html` dengan status 200

File **`public/_redirects`** ikut ter-copy ke `dist/` dan dipakai oleh host yang mendukung format Netlify-style. Jika EdgeOne mendukung, aturan `/* /index.html 200` akan mengarahkan semua path ke index.html.

## API & CORS

- Aplikasi memanggil API: `https://berita-indo-api-next.vercel.app/api/...`
- Di **development** dipakai proxy Vite (`/api-berita` → API) agar tidak kena CORS.
- Di **production** (setelah deploy), request API dari domain Anda. Jika API tidak mengizinkan origin domain Anda, akan kena CORS. Solusi: konfigurasi CORS di sisi API, atau pakai EdgeOne Edge Function sebagai proxy ke API.

## Keamanan

- Tidak ada secret/token di kode front-end
- Link eksternal memakai `rel="noopener noreferrer"`
- Build production: `console` dan `debugger` sudah di-drop oleh Vite

## Ringkasan

1. `npm run build`
2. Deploy isi **dist/** ke EdgeOne Pages
3. Set fallback SPA (404 → index.html atau rewrite `/*` → index.html)
4. Cek CORS jika API tidak bisa diakses dari domain production
