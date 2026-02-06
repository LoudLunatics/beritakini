import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

/**
 * UPGRADE PROXY: Menempatkan AllOrigins sebagai garda terdepan 
 * karena paling stabil untuk data eksternal.
 */
const PROXY_LIST = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

// --- 1. Manajemen Cache ---
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    const now = Date.now();
    const cleanData = parsed.filter(([_, v]) => now - v.at < 259200000); // 3 Hari
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

// --- 2. Helper Fetch ---
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
 * 3. IMPLEMENTASI SEKTOR TERPISAH
 * Memastikan CNN & CNBC tidak memanggil kategori yang salah
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  
  // LOGIC GATEWAY: Normalisasi Kategori Berdasarkan Sektor Sumber
  let targetCategory = category?.toLowerCase();
  
  // Sektor Bisnis/Tech (CNBC)
  if (source === 'cnbc-news') {
    const cnbcMap = {
      'ekonomi': 'market',
      'teknologi': 'tech',
      'nasional': 'news',
      'internasional': 'news',
      'terbaru': ''
    };
    targetCategory = cnbcMap[targetCategory] || targetCategory;
  } 
  // Sektor Umum (CNN)
  else if (source === 'cnn-news') {
    const cnnMap = {
      'market': 'ekonomi',
      'tech': 'teknologi',
      'terbaru': ''
    };
    targetCategory = cnnMap[targetCategory] || targetCategory;
  }

  const path = targetCategory ? `${source}/${targetCategory}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // A. CEK CACHE
  const cached = cache.get(targetUrl);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // B. STRATEGI FETCH BERLAPIS
  try {
    const response = await fetchWithTimeout(targetUrl, { signal }, 4000);
    
    // Jika masih kena 400 (Sektor benar-benar tidak ada di API tersebut)
    if (response.status === 400) {
       console.warn(`Sektor ${targetCategory} tidak ditemukan di ${source}. Redirecting...`);
       return getNews(source, '', signal); // Fallback ke berita utama
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

  // JALUR PROXY (Jika Direct Fetch kena CORS status 200/403)
  for (const getProxyUrl of PROXY_LIST) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const res = await fetchWithTimeout(proxyUrl, {}, 6000);
      
      if (!res.ok) continue;

      const json = await res.json();
      const rawData = json.contents ? JSON.parse(json.contents) : json;
      
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
