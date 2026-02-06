import { useEffect, useState, useMemo } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { getNews } from '../api/newsApi';
import HeroCarousel from '../components/home/HeroCarousel';
import TrendingList from '../components/home/TrendingList';
import NewsCard from '../components/home/NewsCard';
import NewsPagination from '../components/ui/NewsPagination';
import NewsSkeleton from '../components/ui/NewsSkeleton';
import { NEWS_SOURCES, DEBOUNCE_DELAY_MS, ITEMS_PER_PAGE_HOME, HERO_CAROUSEL_COUNT, SKELETON_CARD_COUNT_HOME } from '../constants/config';

const Home = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const ac = new AbortController();
    
    const fetchHomeData = async () => {
      setLoading(true);
      setNews([]); // Reset data saat fetch ulang

      // Optimal: Jalankan semua request secara paralel, 
      // tapi tangani hasilnya segera setelah masing-masing selesai (Incremental)
      const fetchPromises = NEWS_SOURCES.map(async (source) => {
        try {
          const data = await getNews(source.id, '', ac.signal);
          
          if (!ac.signal.aborted && Array.isArray(data) && data.length > 0) {
            const formattedData = data.map(item => ({ ...item, source: source.label }));
            
            // Masukkan data ke state segera setelah tersedia (Tanpa menunggu sumber lain)
            setNews(prev => {
              const updated = [...prev, ...formattedData];
              // Opsional: Urutkan berdasarkan tanggal jika ada field isoDate
              return updated.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
            });
            
            // Matikan loading segera setelah data pertama masuk agar UI muncul
            setLoading(false); 
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error(`Gagal memuat berita dari ${source.label}:`, error);
          }
        }
      });

      // Tunggu semua selesai di background hanya untuk memastikan status loading mati 
      // jika semua sumber ternyata gagal total
      try {
        await Promise.all(fetchPromises);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchHomeData();
    return () => ac.abort();
  }, []);

  // --- Bagian Search & Filter (Tetap Sama) ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchTerm(searchInput);
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const filteredNews = useMemo(() => {
    return news.filter((item) =>
      item?.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, news]);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const heroData = useMemo(() => news.slice(0, HERO_CAROUSEL_COUNT), [news]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE_HOME;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE_HOME;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Container className="pb-5" aria-busy={loading}>
      {/* UI Render (Logika tetap sama agar tidak merusak tampilan) */}
      {!loading && news.length > 0 && (
        <>
          <HeroCarousel data={heroData} />
          <TrendingList data={news} />
        </>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 mt-5 gap-3">
        <h4 className="section-title mb-0">Rekomendasi Berita Terbaru</h4>
        <InputGroup className="search-input-group">
          <Form.Control 
            placeholder="Cari berita..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <InputGroup.Text>🔍</InputGroup.Text>
        </InputGroup>
      </div>

      {loading && news.length === 0 ? (
        <NewsSkeleton count={SKELETON_CARD_COUNT_HOME} />
      ) : (
        <Row>
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <NewsCard key={item.link || item.title || index} item={item} />
            ))
          ) : (
            <div className="text-center py-5 w-100">
              {!loading && news.length === 0 ? (
                <>
                  <p className="text-muted mb-2">Gagal memuat berita.</p>
                  <p className="text-muted small">Server sedang sibuk, silakan coba beberapa saat lagi.</p>
                </>
              ) : !loading && (
                <p className="text-muted">Tidak ada berita yang cocok dengan &quot;{searchTerm}&quot;</p>
              )}
            </div>
          )}
        </Row>
      )}

      {!loading && filteredNews.length > ITEMS_PER_PAGE_HOME && (
        <NewsPagination 
          currentPage={currentPage}
          totalItems={filteredNews.length}
          itemsPerPage={ITEMS_PER_PAGE_HOME}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </Container>
  );
};

export default Home;
