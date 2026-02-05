import { CACHE_TTL_MS } from '../constants/config';

// Deteksi lingkungan: Local vs Production (EdgeOne)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';

// Map untuk menyimpan data { data, at: timestamp }
const cache = new Map();

/**
 * Fungsi internal untuk melakukan fetch dan memperbarui cache di latar belakang
 */
const revalidateCache = async (targetUrl, endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return;

    const result = await response.json();
    let data = [];

    if (!isLocal) {
      const parsedData = JSON.parse(result.contents);
      data = parsedData.data || [];
    } else {
      data = result.data || [];
    }

    if (data.length > 0) {
      cache.set(targetUrl, { data, at: Date.now() });
    }
  } catch (error) {
    console.error("Gagal memperbarui cache di background:", error);
  }
};

/**
 * Fungsi Utama getNews dengan Strategi SWR (Stale-While-Revalidate)
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const targetUrl = `${BASE_URL}/${path}`;
  
  // Tentukan endpoint berdasarkan lingkungan
  const endpoint = !isLocal 
    ? `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`
    : `/api-berita/${path}`;

  // 1. CEK CACHE
  const cached = cache.get(targetUrl);

  if (cached) {
    const isStale = Date.now() - cached.at > CACHE_TTL_MS;

    if (isStale) {
      // DATA BASI: Jalankan revalidasi di background, kembalikan data lama dulu
      console.log(`♻️ Data stale untuk [${path}], memperbarui di background...`);
      revalidateCache(targetUrl, endpoint);
      return cached.data;
    }

    // DATA SEGAR: Kembalikan langsung
    console.log(`⚡ Mengambil dari cache (Fresh): [${path}]`);
    return cached.data;
  }

  // 2. JIKA TIDAK ADA CACHE SAMA SEKALI (First Load)
  try {
    console.log(`🌐 Fetching data baru untuk: [${path}]...`);
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

    // Simpan ke Cache
    if (data.length > 0) {
      cache.set(targetUrl, { data, at: Date.now() });
    }

    return data;
  } catch (e) {
    if (e.name === 'AbortError') return [];
    console.error("Fetch Error:", e);
    return [];
  }
};
