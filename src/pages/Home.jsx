import { useEffect, useState, useMemo } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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
  // Inisialisasi loading: Jika ada cache di localStorage, jangan tampilkan skeleton (loading = false)
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
        // 1. AMBIL DATA DARI PERSISTENT CACHE (UNTUK TAMPILAN INSTAN)
        const cachedRaw = localStorage.getItem('news_cache_persistent');
        if (cachedRaw) {
          try {
            const cachedMap = new Map(JSON.parse(cachedRaw));
            // Kumpulkan semua berita dari berbagai source yang ada di cache
            const initialNews = Array.from(cachedMap.values()).flatMap(item => item.data);
            
            if (initialNews.length > 0) {
              setNews(initialNews);
              setLoading(false); // Matikan skeleton karena data cache sudah muncul
            }
          } catch (e) {
            console.error("Gagal parse cache awal:", e);
          }
        }

        // 2. REVALIDASI (AMBIL DATA TERBARU DARI API)
        const responses = await Promise.all(
          NEWS_SOURCES.map(async (source) => {
            try {
              const data = await getNews(source.id, '', ac.signal);
              return Array.isArray(data) ? data.map(item => ({ ...item, source: source.label })) : [];
            } catch (error) {
              if (error.name === 'AbortError') throw error;
              return [];
            }
          })
        );

        if (!ac.signal.aborted) {
          const newsArray = responses.flatMap(data => (Array.isArray(data) ? data : []));
          
          // Hanya update state jika data API berbeda/lebih baru dari cache
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

  // Logika Debounce untuk Search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchTerm(searchInput);
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Filter Berita berdasarkan Search
  const filteredNews = useMemo(() => {
    return news.filter((item) =>
      item?.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, news]);

  // Reset ke halaman 1 saat mencari
  useEffect(() => setCurrentPage(1), [searchTerm]);

  // Data untuk Carousel Utama
  const heroData = useMemo(() => news.slice(0, HERO_CAROUSEL_COUNT), [news]);

  // Logika Pagination
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE_HOME;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE_HOME;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Container className="pb-5" aria-busy={loading}>
      {/* Hero & Trending muncul jika data ada (baik dari cache maupun API) */}
      {news.length > 0 && (
        <>
          <HeroCarousel data={heroData} />
          <TrendingList data={news} />
        </>
      )}

      {/* Header & Search Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 mt-5 gap-3">
        <h4 className="section-title mb-0">Rekomendasi Berita Terbaru</h4>
        <InputGroup className="search-input-group" style={{ maxWidth: '400px' }}>
          <Form.Control 
            placeholder="Cari berita..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <InputGroup.Text className="bg-primary text-white border-primary">
            <i className="bi bi-search"></i>
          </InputGroup.Text>
        </InputGroup>
      </div>

      {/* Konten Utama (Skeleton vs Grid) */}
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
                <div className="alert alert-warning d-inline-block px-5">
                  <p className="mb-0 fw-bold">Gagal memuat berita.</p>
                  <small>Coba periksa koneksi atau refresh halaman.</small>
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

      {/* Pagination */}
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

