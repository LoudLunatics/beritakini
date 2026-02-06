import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

const PROXY_LIST = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`
];

// --- 1. Manajemen Cache (Tetap sama, dioptimalkan proses simpan) ---
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
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
    console.warn("Storage Full:", e);
  }
};

// --- 2. Helper Fetch (Tetap sama) ---
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
 * 3. UPGRADED getNews
 * Menangani mapping kategori otomatis agar tidak Error 400
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  // UPGRADE: Normalisasi Kategori
  // Beberapa API butuh kategori spesifik, jika 'terbaru' atau kosong, langsung ke source
  const cleanCategory = category?.toLowerCase() === 'terbaru' ? '' : category;
  const path = cleanCategory ? `${source}/${cleanCategory}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // A. CEK CACHE
  const cached = cache.get(targetUrl);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // B. STRATEGI FETCH BERLAPIS
  
  // Jalur 1: Coba Direct Fetch
  try {
    const response = await fetchWithTimeout(targetUrl, { signal }, 4000);
    
    // UPGRADE: Handle status 400 (Kategori tidak ditemukan di source ini)
    if (response.status === 400 && cleanCategory) {
       console.warn(`Kategori ${cleanCategory} tidak ada di ${source}, fallback ke terbaru.`);
       return getNews(source, '', signal); // Fallback otomatis ke berita utama source tsb
    }

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
  }

  // Jalur 2: Coba Proxy secara berurutan
  for (const getProxyUrl of PROXY_LIST) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const res = await fetchWithTimeout(proxyUrl, {}, 6000);
      
      if (!res.ok) continue;

      const json = await res.json();
      const rawData = json.contents ? JSON.parse(json.contents) : json;
      
      // UPGRADE: Validasi data proxy agar tidak simpan error 400
      if (rawData.status === 400) continue; 

      const data = rawData.data || [];
      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
        return data;
      }
    } catch (proxyErr) {
      continue;
    }
  }

  return cached ? cached.data : [];
};
