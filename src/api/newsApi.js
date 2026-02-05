import { CACHE_TTL_MS } from '../constants/config';

// Inisialisasi cache dari localStorage agar muncul instan 0ms
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
  
  /**
   * PENTING: Gunakan path relatif /api-berita
   * Vercel akan meneruskan ini ke API asli di sisi server (bebas CORS)
   */
  const endpoint = `/api-berita/${path}`;

  // 1. Cek Cache agar muncul instan
  const cached = cache.get(endpoint);
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // 2. Ambil data baru
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
    // Jika gagal (CORS/Network), pakai data lama yang ada di cache
    return cached ? cached.data : [];
  }
};
