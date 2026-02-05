import { useEffect, useState, useMemo } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col'; // Perbaikan: Pastikan Col di-import
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { getNews } from '../api/newsApi';
import HeroCarousel from '../components/home/HeroCarousel';
import TrendingList from '../components/home/TrendingList';
import NewsCard from '../components/home/NewsCard';
import NewsPagination from '../components/ui/NewsPagination';
import NewsSkeleton from '../components/ui/NewsSkeleton';
import { 
  NEWS_SOURCES, 
  DEBOUNCE_DELAY_MS, 
  ITEMS_PER_PAGE_HOME, 
  HERO_CAROUSEL_COUNT, 
  SKELETON_CARD_COUNT_HOME 
} from '../constants/config';

const Home = () => {
  const [news, setNews] = useState([]);
  
  // Inisialisasi loading: Jika ada cache di localStorage, jangan tampilkan skeleton sejak awal
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('news_cache_persistent');
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const ac = new AbortController();
    
    const fetchHomeData = async () => {
      try {
        // 1. AMBIL DATA DARI PERSISTENT CACHE (UNTUK TAMPILAN INSTAN 0ms)
        const cachedRaw = localStorage.getItem('news_cache_persistent');
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            // Konversi kembali Array ke Map untuk mengambil data
            const cachedMap = new Map(parsed);
            const initialNews = Array.from(cachedMap.values()).flatMap(item => item.data || []);
            
            if (initialNews.length > 0) {
              setNews(initialNews);
              setLoading(false); // Matikan skeleton segera karena data cache sudah muncul
            }
          } catch (e) {
            console.error("Gagal parse cache awal:", e);
          }
        }

        // 2. REVALIDASI (AMBIL DATA TERBARU DARI API SECARA PARALEL)
        const responses = await Promise.all(
          NEWS_SOURCES.map(async (source) => {
            try {
              const data = await getNews(source.id, '', ac.signal);
              return Array.isArray(data) 
                ? data.map(item => ({ ...item, source: source.label })) 
                : [];
            } catch (error) {
              if (error.name === 'AbortError') throw error;
              return [];
            }
          })
        );

        if (!ac.signal.aborted) {
          const newsArray = responses.flatMap(data => data);
          
          // Hanya update state jika berhasil mendapatkan data dari API
          if (newsArray.length > 0) {
            setNews(newsArray);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Gagal memuat berita:", err);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchHomeData();
    return () => ac.abort();
  }, []);

  // Logika Debounce untuk Fitur Search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchTerm(searchInput);
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Filter Berita berdasarkan input pencarian
  const filteredNews = useMemo(() => {
    return news.filter((item) =>
      item?.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, news]);

  // Reset ke halaman 1 setiap kali user mencari sesuatu
  useEffect(() => setCurrentPage(1), [searchTerm]);

  // Ambil beberapa berita untuk Carousel di bagian atas
  const heroData = useMemo(() => news.slice(0, HERO_CAROUSEL_COUNT), [news]);

  // Logika Pagination (Halaman)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE_HOME;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE_HOME;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Container className="pb-5" aria-busy={loading}>
      {/* Tampilkan Hero & Trending segera jika data sudah ada di News state */}
      {news.length > 0 && (
        <>
          <HeroCarousel data={heroData} />
          <TrendingList data={news} />
        </>
      )}

      {/* Header Seksi & Bar Pencarian */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 mt-5 gap-3">
        <h4 className="section-title mb-0">Rekomendasi Berita Terbaru</h4>
        <InputGroup className="search-input-group" style={{ maxWidth: '400px' }}>
          <Form.Control 
            placeholder="Cari berita..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <InputGroup.Text className="bg-primary text-white border-primary">
            🔍
          </InputGroup.Text>
        </InputGroup>
      </div>

      {/* Grid Utama: Skeleton vs List Berita */}
      {loading ? (
        <NewsSkeleton count={SKELETON_CARD_COUNT_HOME} />
      ) : (
        <Row className="gy-4">
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <NewsCard key={item.link || index} item={item} />
            ))
          ) : (
            <Col xs={12} className="text-center py-5">
              {news.length === 0 ? (
                <div className="alert alert-warning d-inline-block px-5 shadow-sm">
                  <p className="mb-0 fw-bold">Gagal memuat berita.</p>
                  <small>Coba periksa file vercel.json atau koneksi internet.</small>
                </div>
              ) : (
                <p className="text-muted fs-5">
                  Tidak ada berita yang cocok dengan &quot;<strong>{searchTerm}</strong>&quot;
                </p>
              )}
            </Col>
          )}
        </Row>
      )}

      {/* Kontrol Pagination */}
      {!loading && filteredNews.length > ITEMS_PER_PAGE_HOME && (
        <div className="mt-5 d-flex justify-content-center">
          <NewsPagination 
            currentPage={currentPage}
            totalItems={filteredNews.length}
            itemsPerPage={ITEMS_PER_PAGE_HOME}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </Container>
  );
};

export default Home;
