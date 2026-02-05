import { CACHE_TTL_MS } from '../constants/config';

// 1. Fungsi load cache yang lebih aman
const getStorageCache = () => {
  try {
    const saved = localStorage.getItem('news_cache_persistent');
    if (!saved) return new Map();
    
    // Konversi kembali dari Array ke Map
    const parsed = JSON.parse(saved);
    return new Map(parsed);
  } catch (e) {
    console.error("Cache korup, membersihkan storage...", e);
    localStorage.removeItem('news_cache_persistent');
    return new Map();
  }
};

const cache = getStorageCache();

// 2. Fungsi simpan yang benar (Map ke Array)
const saveToStorage = () => {
  try {
    const dataArray = Array.from(cache.entries());
    localStorage.setItem('news_cache_persistent', JSON.stringify(dataArray));
  } catch (e) {
    console.error("Gagal simpan ke localStorage:", e);
  }
};

export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  
  // Pastikan endpoint konsisten untuk key cache
  const endpoint = `/api-berita/${path}`;

  // 3. Cek Cache (SWR Logic)
  const cached = cache.get(endpoint);
  
  // Jika ada cache dan masih segar (< TTL)
  if (cached && (Date.now() - cached.at < CACHE_TTL_MS)) {
    return cached.data;
  }

  // 4. Ambil data baru
  try {
    const response = await fetch(endpoint, { signal });
    
    if (!response.ok) {
      // Jika server error (500/404), gunakan data lama jika ada (Graceful Degradation)
      if (cached) return cached.data;
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    const data = result.data || [];

    if (data.length > 0) {
      // Update memori dan storage
      cache.set(endpoint, { data, at: Date.now() });
      saveToStorage();
    }
    
    return data;
  } catch (e) {
    if (e.name === 'AbortError') return cached?.data || [];
    
    // Fallback terakhir: jika internet mati, tampilkan yang ada di cache
    console.warn("Koneksi gagal, menggunakan cache lama.");
    return cached ? cached.data : [];
  }
};
