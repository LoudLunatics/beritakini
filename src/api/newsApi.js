import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = 'https://berita-indo-api-next.vercel.app/api';
const PROXY_URL = 'https://api.allorigins.win/get?url=';

// In-memory cache untuk akses secepat kilat
let cache = new Map();

/** * Memuat cache dengan sistem pembersihan (Pruning)
 */
const initCache = () => {
    try {
        const saved = localStorage.getItem('news_cache_persistent');
        if (!saved) return;
        const parsed = JSON.parse(saved);
        // Hanya ambil data yang belum basi lebih dari 2 hari untuk hemat storage
        const now = Date.now();
        const filtered = parsed.filter(([_, val]) => now - val.at < 86400000 * 2);
        cache = new Map(filtered);
    } catch (e) {
        console.error("Cache Init Error:", e);
    }
};

initCache();

const saveToStorage = () => {
    try {
        const dataArray = Array.from(cache.entries());
        // Gunakan setTimeout agar tidak menghambat thread utama UI
        setTimeout(() => {
            localStorage.setItem('news_cache_persistent', JSON.stringify(dataArray));
        }, 0);
    } catch (e) {
        console.warn("Storage Full:", e);
    }
};

/**
 * Fungsi Fetch Ringan dengan timeout otomatis
 */
export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
    const path = category ? `${source}/${category}` : source;
    const targetUrl = `${BASE_URL}/${path}`;
    const now = Date.now();

    // 1. HIT CACHE (Instan)
    const cached = cache.get(targetUrl);
    if (cached && (now - cached.at < CACHE_TTL_MS)) {
        return cached.data;
    }

    // 2. LOGIKA FETCH CEPAT
    const controller = new AbortController();
    const fetchSignal = signal || controller.signal;

    // Fungsi fetch dengan AllOrigins sebagai backup otomatis
    const fetchData = async () => {
        try {
            // Coba fetch langsung
            const response = await fetch(targetUrl, { signal: fetchSignal });
            if (!response.ok) throw new Error("Direct Fail");
            const result = await response.json();
            return result.data || [];
        } catch (err) {
            if (err.name === 'AbortError') throw err;
            
            // Jika gagal/CORS, langsung pindah ke proxy
            const proxyRes = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
            const proxyJson = await proxyRes.json();
            const actualData = JSON.parse(proxyJson.contents);
            return actualData.data || [];
        }
    };

    try {
        // Jalankan fetch
        const data = await fetchData();

        if (data && data.length > 0) {
            cache.set(targetUrl, { data, at: now });
            saveToStorage();
            return data;
        }
        return cached?.data || [];
    } catch (error) {
        // Jika offline atau error total, berikan data lama yang tersisa di cache
        return cached?.data || [];
    }
};
