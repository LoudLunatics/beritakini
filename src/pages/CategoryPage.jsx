import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row } from 'react-bootstrap';
import { getNews } from '../api/newsApi';
import NewsCard from '../components/home/NewsCard';
import NewsPagination from '../components/ui/NewsPagination';
import NewsSkeleton from '../components/ui/NewsSkeleton';
import { NEWS_SOURCES, ITEMS_PER_PAGE_CATEGORY, SKELETON_CARD_COUNT_CATEGORY } from '../constants/config';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const ac = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      setNews([]); // Bersihkan data lama saat pindah kategori
      setCurrentPage(1);

      // Jalankan fetch secara paralel tanpa menunggu satu sama lain
      const fetchTasks = NEWS_SOURCES.map(async (source) => {
        try {
          const data = await getNews(source.id, categoryId, ac.signal);
          
          if (!ac.signal.aborted && Array.isArray(data) && data.length > 0) {
            const formattedData = data.map(item => ({ ...item, source: source.label }));
            
            // Masukkan data segera setelah siap (Incremental Update)
            setNews(prev => {
              const combined = [...prev, ...formattedData];
              // Urutkan berdasarkan tanggal terbaru agar tidak berantakan
              return combined.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
            });

            // Matikan skeleton segera setelah data pertama masuk
            setLoading(false);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error(`Gagal memuat ${source.label}:`, error);
          }
        }
      });

      // Tunggu semua selesai di background hanya untuk memastikan status loading akhir
      try {
        await Promise.all(fetchTasks);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => ac.abort();
  }, [categoryId]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE_CATEGORY;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE_CATEGORY;
  const currentItems = news.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Container className="py-4" aria-busy={loading}>
      {/* Header Judul yang Responsif */}
      <h2 className={`section-title text-capitalize mb-5 ${loading && news.length === 0 ? 'placeholder-glow' : ''}`}>
        {loading && news.length === 0 ? (
          <span className="placeholder col-3"></span>
        ) : (
          `Berita ${categoryId ? categoryId.replace(/-/g, ' ') : ''}`
        )}
      </h2>
      
      {/* Tampilkan Skeleton hanya jika belum ada data sama sekali */}
      {loading && news.length === 0 ? (
        <NewsSkeleton count={SKELETON_CARD_COUNT_CATEGORY} /> 
      ) : (
        <>
          <Row>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <NewsCard key={item.link || `${item.title}-${index}`} item={item} />
              ))
            ) : !loading && (
              <div className="text-center py-5 w-100">
                <p className="text-muted fs-5">Tidak ada berita ditemukan untuk kategori ini.</p>
                <p className="text-muted small">Mungkin sumber tidak memiliki kategori "{categoryId}"</p>
              </div>
            )}
          </Row>

          {/* Pagination Muncul jika total data > limit per halaman */}
          {news.length > ITEMS_PER_PAGE_CATEGORY && (
            <NewsPagination 
              currentPage={currentPage}
              totalItems={news.length}
              itemsPerPage={ITEMS_PER_PAGE_CATEGORY}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default CategoryPage;
