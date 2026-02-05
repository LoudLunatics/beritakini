import { CACHE_TTL_MS } from '../constants/config';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

/**
 * PERBAIKAN: Cara mengambil data dari localStorage yang benar
 */
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    // Jika ada data, ubah dari Array kembali ke Map
    return saved ? new Map(JSON.parse(saved)) : new Map();
  } catch (e) {
    console.error("Gagal load cache:", e);
    return new Map();
  }
};

const cache = getStorageCache();

/**
 * PERBAIKAN: Cara menyimpan Map ke localStorage (Ubah ke Array dulu)
 */
const saveToStorage = () => {
  try {
    const arrayData = Array.from(cache.entries());
    localStorage.setItem('news_cache_persistent', JSON.stringify(arrayData));
  } catch (e) {
    console.error("Gagal simpan cache:", e);
  }
};

const revalidateCache = async (targetUrl, endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return;
    const result = await response.json();
    
    let data = [];
    if (!isLocal) {
      // Proxy AllOrigins mengembalikan JSON dalam field 'contents' sebagai string
      const parsedData = JSON.parse(result.contents);
      data = parsedData.data || [];
    } else {
      data = result.data || [];
    }

    if (data && data.length > 0) {
      cache.set(targetUrl, { data, at: Date.now() });
      saveToStorage();
    }
  } catch (error) {
    console.error("Background update failed:", error);
  }
};

export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  const endpoint = !isLocal 
    ? `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`
    : `/api-berita/${path}`;

  // 1. CEK CACHE (Instant Load)
  const cached = cache.get(targetUrl);

  if (cached && Array.isArray(cached.data)) {
    const isStale = Date.now() - cached.at > CACHE_TTL_MS;
    if (isStale) {
      revalidateCache(targetUrl, endpoint);
    }
    return cached.data; 
  }

  // 2. FETCH JIKA KOSONG
  try {
    const response = await fetch(endpoint, { signal: signal || undefined });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    
    let data = [];
    if (!isLocal) {
      const parsedData = JSON.parse(result.contents);
      data = parsedData.data || [];
    } else {
      data = result.data || [];
    }

    if (data && data.length > 0) {
      cache.set(targetUrl, { data, at: Date.now() });
      saveToStorage();
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') return [];
    return [];
  }
};
