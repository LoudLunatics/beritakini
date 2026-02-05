import { CACHE_TTL_MS } from '../constants/config';

const BASE_URL = import.meta.env.DEV
  ? '/api-berita'
  : 'https://berita-indo-api-next.vercel.app/api';
const cache = new Map();

export const getNews = async (source = 'cnbc-news', category = '', signal = null) => {
  const path = category ? `${source}/${category}` : source;
  const endpoint = `${BASE_URL}/${path}`;
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  try {
    const response = await fetch(endpoint, { signal: signal || undefined });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    const data = result.data || [];
    cache.set(endpoint, { data, at: Date.now() });
    return data;
  } catch (e) {
    if (e.name === 'AbortError') return [];
    return [];
  }
};