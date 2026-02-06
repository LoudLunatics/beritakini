import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

/**
 * PROXY_LIST yang diperbarui: 
 * AllOrigins (Metode GET) adalah yang paling stabil untuk menghindari limitasi header.
 */
const PROXY_LIST = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // ThingProxy ditaruh terakhir karena sering gagal (berdasarkan log Anda)
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`
];

// --- 1. Manajemen Cache (LocalStorage) ---
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    const now = Date.now();
    // Pruning data > 3 hari
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

// --- 2. Helper Fetch dengan Timeout yang lebih ketat ---
const fetchWithTimeout = async (url, options = {}, timeout = 4000) => {
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
 * 3. getNews dengan Sektor Terpisah & Mapping Otomatis
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  // Mapping otomatis untuk mencegah Status 400
  let targetCategory = category?.toLowerCase();
  
  if (source === 'cnbc-news') {
    const cnbcMap = {
      'ekonomi': 'market',
      'nasional': 'news',
      'internasional': 'news',
      'teknologi': 'tech',
      'terbaru': ''
    };
    targetCategory = cnbcMap[targetCategory] || targetCategory;
  } else if (source === 'cnn-news') {
    const cnnMap = {
      'market': 'ekonomi',
      'tech': 'teknologi',
      'terbaru': ''
    };
    targetCategory = cnnMap[targetCategory] || targetCategory;
  }

  const path = targetCategory ? `${source}/${targetCategory}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // A. CEK CACHE (Prioritas Utama)
  const cached = cache.get(targetUrl);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // B. JALUR 1: Direct Fetch (Coba cepat)
  try {
    const response = await fetchWithTimeout(targetUrl, { signal }, 3000);
    if (response.ok) {
      const result = await response.json();
      const data = result.data || [];
      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
      }
      return data;
    }
    if (response.status === 400) return getNews(source, '', signal);
  } catch (err) {
    // Abaikan error CORS/Timeout di sini, langsung lanjut ke Proxy
  }

  // C. JALUR 2: Proxy Berseri (Failover)
  for (const getProxyUrl of PROXY_LIST) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const res = await fetchWithTimeout(proxyUrl, {}, 5000);
      
      if (!res.ok) continue;

      const json = await res.json();
      // AllOrigins butuh JSON.parse pada properti 'contents'
      let actualData;
      if (json.contents) {
        actualData = JSON.parse(json.contents);
      } else {
        actualData = json;
      }

      const data = actualData.data || [];
      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
        return data;
      }
    } catch (proxyErr) {
      console.warn("Proxy Error, mencoba alternatif...");
      continue; 
    }
  }

  // JALUR TERAKHIR: Berikan data basi daripada kosong
  return cached ? cached.data : [];
};
