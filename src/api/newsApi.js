import { CACHE_TTL_MS } from '../constants/config';

// Deteksi apakah sedang di localhost atau sudah di internet (EdgeOne)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';
const cache = new Map();

export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // 1. Cek Cache (Agar Instan)
  const cached = cache.get(targetUrl);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    console.log(`⚡ Mengambil data dari cache: ${path}`);
    return cached.data;
  }

  // 2. Tentukan Endpoint (Gunakan AllOrigins di EdgeOne untuk tembus CORS)
  const endpoint = !isLocal 
    ? `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`
    : `/api-berita/${path}`;

  try {
    const response = await fetch(endpoint, { signal: signal || undefined });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    let data = [];

    // 3. Ekstraksi Data (AllOrigins membungkus data asli di 'contents')
    if (!isLocal) {
      const parsedData = JSON.parse(result.contents);
      data = parsedData.data || [];
    } else {
      data = result.data || [];
    }

    // 4. Simpan ke Cache
    cache.set(targetUrl, { data, at: Date.now() });
    return data;
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.error("Fetch Error:", e);
    return [];
  }
};
