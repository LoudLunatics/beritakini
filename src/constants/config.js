/** * 1. Filter Sumber Berita 
 * Dibatasi menjadi 2 sumber paling stabil untuk performa maksimal 
 */
export const NEWS_SOURCES = [
  { id: 'cnn-news', label: 'CNN' },
  { id: 'cnbc-news', label: 'CNBC' }
];

export const DEBOUNCE_DELAY_MS = 500;

/** * 2. Optimasi Cache 
 * Dinaikkan menjadi 5 menit (5 * 60 * 1000) agar tidak terlalu sering fetch ke proxy 
 */
export const CACHE_TTL_MS = 5 * 60 * 1000; 

/** * 3. Layout Grid 
 * Menyesuaikan dengan jumlah kolom Bootstrap (col-md-3 = 4 kartu per baris)
 */
export const ITEMS_PER_PAGE_HOME = 8;
export const ITEMS_PER_PAGE_CATEGORY = 12;

export const HERO_CAROUSEL_COUNT = 3;
export const TRENDING_COUNT = 3;
export const POPULAR_NEWS_COUNT = 5;
export const RELATED_NEWS_COUNT = 3;

/** Jumlah card skeleton harus sinkron dengan ITEMS_PER_PAGE */
export const SKELETON_CARD_COUNT_HOME = 8;
export const SKELETON_CARD_COUNT_CATEGORY = 12;
