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
      try {
        setLoading(true);
        const responses = await Promise.all(
          NEWS_SOURCES.map(async (source) => {
            try {
              const data = await getNews(source.id, categoryId, ac.signal);
              return Array.isArray(data) ? data.map(item => ({ ...item, source: source.label })) : [];
            } catch (error) {
              if (error.name === 'AbortError') throw error;
              console.error(`Gagal memuat kategori dari ${source.label}:`, error);
              return [];
            }
          })
        );
        if (!ac.signal.aborted) {
          const newsArray = responses.flatMap(data => Array.isArray(data) ? data : []);
          setNews(newsArray);
          setCurrentPage(1);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setNews([]);
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
      <h2 className={`section-title text-capitalize mb-5 ${loading ? 'placeholder-glow' : ''}`}>
        {loading ? (
          <span className="placeholder col-3"></span>
        ) : (
          `Berita ${categoryId ? categoryId.replace('-', ' ') : ''}`
        )}
      </h2>
      
      {loading ? (
        <NewsSkeleton count={SKELETON_CARD_COUNT_CATEGORY} /> 
      ) : (
        <Row>
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <NewsCard key={item.link || item.title || index} item={item} />
            ))
          ) : (
            <div className="text-center py-5 w-100">
              <p className="text-muted fs-5">Berita tidak ditemukan untuk kategori ini.</p>
            </div>
          )}
        </Row>
      )}

      {/* Pagination */}
      {!loading && news.length > ITEMS_PER_PAGE_CATEGORY && (
        <NewsPagination 
          currentPage={currentPage}
          totalItems={news.length}
          itemsPerPage={ITEMS_PER_PAGE_CATEGORY}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo(0, 0); 
          }}
        />
      )}
    </Container>
  );
};

export default CategoryPage;