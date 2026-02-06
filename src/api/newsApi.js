import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

/**
 * AllOrigins adalah proxy paling stabil untuk menangani CORS status 200.
 * Kita hapus ThingProxy karena sering gagal (CORS request did not succeed).
 */
const PROXY_LIST = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

// --- 1. Manajemen Cache ---
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    const now = Date.now();
    const cleanData = parsed.filter(([_, v]) => now - v.at < 259200000);
    return new Map(cleanData);
  } catch (e) { return new Map(); }
};

let cache = getStorageCache();

const saveToStorage = () => {
  try {
    const dataArray = Array.from(cache.entries());
    localStorage.setItem('news_cache_persistent', JSON.stringify(dataArray));
  } catch (e) { console.warn("Storage Full:", e); }
};

const fetchWithTimeout = async (url, options = {}, timeout = 4000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) { clearTimeout(id); throw e; }
};

/**
 * 3. getNews dengan Mapping Sektor (Berdasarkan Gambar Anda)
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  let targetCategory = category?.toLowerCase();
  
  // MAPPING SEKTOR BERDASARKAN GAMBAR API ANDA
  if (source === 'cnbc-news') {
    const cnbcAllowed = {
      'ekonomi': 'market',
      'nasional': 'news',
      'internasional': 'news',
      'teknologi': 'tech',
      'hiburan': 'lifestyle',
      'gaya-hidup': 'lifestyle',
      'olahraga': 'news' // CNBC tidak punya olahraga, alihkan ke umum
    };
    // Gunakan map jika ada, jika tidak gunakan input asli (misal: 'syariah', 'entrepreneur')
    targetCategory = cnbcAllowed[targetCategory] || targetCategory;
  } 
  else if (source === 'cnn-news') {
    // CNN cenderung menggunakan nama standar sesuai gambar Anda
    if (targetCategory === 'teknologi') targetCategory = 'teknologi';
    if (targetCategory === 'gaya-hidup') targetCategory = 'gaya-hidup';
  }

  const path = targetCategory && targetCategory !== 'terbaru' ? `${source}/${targetCategory}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  const cached = cache.get(targetUrl);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) return cached.data;

  // JALUR 1: Direct Fetch
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
    // Jika 400, fallback ke utama agar tidak crash
    if (response.status === 400) return getNews(source, '', signal);
  } catch (err) { /* Lanjut ke Proxy */ }

  // JALUR 2: Proxy Failover
  for (const getProxyUrl of PROXY_LIST) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const res = await fetchWithTimeout(proxyUrl, {}, 5000);
      if (!res.ok) continue;

      const json = await res.json();
      const actualData = json.contents ? JSON.parse(json.contents) : json;
      
      if (actualData.status === 400) continue; 

      const data = actualData.data || [];
      if (data.length > 0) {
        cache.set(targetUrl, { data, at: Date.now() });
        saveToStorage();
        return data;
      }
    } catch (e) { continue; }
  }

  return cached ? cached.data : [];
};
