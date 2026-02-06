import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

// List proxy cadangan karena AllOrigins sering Error 522
const PROXY_LIST = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`
];

/**
 * 1. Manajemen Cache (LocalStorage)
 */
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    // Pruning: Buang data yang sudah lebih dari 3 hari agar storage tidak bengkak
    const now = Date.now();
    const cleanData = parsed.filter(([_, v]) => now - v.at < 259200000);
    return new Map(cleanData);
  } catch (e) {
    return new Map();
  }
};

let cache = getStorageCache();

const saveToStorage = () => {
  try {
    const dataArray = Array.from(cache.entries());
    localStorage.setItem('news_cache_persistent', JSON.stringify(dataArray));
  } catch (e) {
    console.warn("Storage Full atau Error:", e);
  }
};

/**
 * 2. Helper Fetch dengan Timeout
 * Mencegah loading "selamanya" jika server gantung
 */
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

/**
 * 3. Fungsi Utama (getNews)
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // A. CEK CACHE
  const cached = cache.get(targetUrl);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // B. STRATEGI FETCH BERLAPIS
  
  // Jalur 1: Coba Direct Fetch (Cepat)
  try {
    const response = await fetchWithTimeout(targetUrl, { signal }, 4000);
    if (response.ok) {
      const result = await response.json();
      const data = result.data || [];
      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
      }
      return data;
    }
  } catch (err) {
    if (err.name === 'AbortError') return cached?.data || [];
    console.warn(`Direct fetch blocked/timeout untuk ${path}, mencoba proxy...`);
  }

  // Jalur 2: Coba Proxy secara berurutan
  for (const getProxyUrl of PROXY_LIST) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const res = await fetchWithTimeout(proxyUrl, {}, 6000);
      
      if (!res.ok) continue;

      const json = await res.json();
      // AllOrigins membungkus di 'contents', proxy lain biasanya langsung
      const rawData = json.contents ? JSON.parse(json.contents) : json;
      const data = rawData.data || [];

      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
        return data;
      }
    } catch (proxyErr) {
      console.error(`Proxy gagal:`, proxyErr.message);
      continue; // Coba proxy berikutnya di list
    }
  }

  // JALUR TERAKHIR: Return cache lama jika ada, atau array kosong
  console.error("Semua metode fetch gagal.");
  return cached ? cached.data : [];
};
