import { CACHE_TTL_MS } from '../constants/config';

// Inisialisasi cache dari localStorage agar berita muncul instan 0ms
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    return saved ? new Map(JSON.parse(saved)) : new Map();
  } catch (e) {
    return new Map();
  }
};

const cache = getStorageCache();

const saveToStorage = () => {
  localStorage.setItem('news_cache_persistent', JSON.stringify(Array.from(cache.entries())));
};

export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  
  // GUNAKAN PATH INI: Ini akan melewati proxy Vercel Rewrites
  const endpoint = `/api-berita/${path}`;

  // 1. Cek Cache (Instant Load)
  const cached = cache.get(endpoint);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // 2. Fetch Data
  try {
    const response = await fetch(endpoint, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    const data = result.data || [];

    if (data.length > 0) {
      cache.set(endpoint, { data, at: Date.now() });
      saveToStorage();
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') return [];
    // Jika gagal fetch, tampilkan data lama dari cache jika ada
    return cached ? cached.data : [];
  }
};
