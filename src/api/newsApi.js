import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

/**
 * Fungsi untuk mengambil cache dari LocalStorage (Data Map)
 */
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    // Konversi kembali dari Array format ke Map
    return new Map(JSON.parse(saved));
  } catch (e) {
    console.error("Gagal memuat cache:", e);
    return new Map();
  }
};

const cache = getStorageCache();

/**
 * Fungsi untuk simpan permanen ke LocalStorage
 */
const saveToStorage = () => {
  try {
    const dataArray = Array.from(cache.entries());
    localStorage.setItem('news_cache_persistent', JSON.stringify(dataArray));
  } catch (e) {
    console.error("Gagal menyimpan ke storage:", e);
  }
};

/**
 * Fungsi Utama dengan penanganan CORS Otomatis
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const targetUrl = `${BASE_URL}/${path}`;

  // 1. CEK CACHE (Muncul instan 0ms)
  const cached = cache.get(targetUrl);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    console.log(`⚡ Load dari cache: ${path}`);
    return cached.data;
  }

  // 2. STRATEGI FETCH: Coba Langsung -> Gagal? -> Pakai Proxy
  try {
    console.log(`🌐 Mencoba fetch langsung: ${path}`);
    const response = await fetch(targetUrl, { signal });
    
    // Jika kena CORS, fetch biasanya langsung lempar ke catch, 
    // tapi jika status tidak 200, kita lempar manual.
    if (!response.ok) throw new Error("Direct fetch failed");

    const result = await response.json();
    const data = result.data || [];

    if (data.length > 0) {
      cache.set(targetUrl, { data, at: Date.now() });
      saveToStorage();
    }
    return data;

  } catch (error) {
    // Abaikan jika request sengaja dibatalkan (AbortController)
    if (error.name === 'AbortError') return cached?.data || [];

    console.warn(`⚠️ CORS Blocked/Error. Mengalihkan ke Proxy untuk: ${source}`);

    // JALUR PROXY (AllOrigins) - Solusi untuk EdgeOne
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      const proxyJson = await proxyRes.json();
      
      // AllOrigins membungkus hasil asli di dalam string 'contents'
      const actualData = JSON.parse(proxyJson.contents);
      const data = actualData.data || [];

      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
      }
      return data;
    } catch (proxyError) {
      console.error("🔴 Semua metode fetch gagal:", proxyError);
      // Jika internet mati/proxy down, tampilkan data lama dari cache (Last Resort)
      return cached ? cached.data : [];
    }
  }
};
