import { CACHE_TTL_MS } from '../constants/config';

const isLocal = window.location.hostname === 'localhost';
const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

// Ambil cache dari localStorage agar web dibuka langsung muncul berita
const getStorageCache = () => {
  const saved = localStorage.getItem('news_cache_persistent');
  return saved ? new Map(JSON.parse(saved)) : new Map();
};

const cache = getStorageCache();

const saveToStorage = () => {
  localStorage.setItem('news_cache_persistent', JSON.stringify(Array.from(cache.entries())));
};

export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // 1. Instant Load dari Cache
  const cached = cache.get(targetUrl);
  if (cached) {
    const isStale = Date.now() - cached.at > CACHE_TTL_MS;
    if (isStale) fetchAndUpdate(targetUrl, path); // Update di background
    return cached.data;
  }

  return await fetchAndUpdate(targetUrl, path, signal);
};

// Fungsi helper untuk fetch langsung (Tanpa Proxy AllOrigins)
const fetchAndUpdate = async (targetUrl, path, signal = null) => {
  try {
    const response = await fetch(targetUrl, { signal });
    if (!response.ok) throw new Error("Gagal Fetch");
    
    const result = await response.json();
    const data = result.data || [];

    if (data.length > 0) {
      cache.set(targetUrl, { data, at: Date.now() });
      saveToStorage();
    }
    return data;
  } catch (e) {
    return [];
  }
};
