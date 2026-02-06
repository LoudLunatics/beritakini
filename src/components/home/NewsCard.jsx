import { memo } from 'react';
import { Card, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NewsCard = memo(function NewsCard({ item }) {
  // 1. Optimasi format tanggal: Hanya hitung jika item ada
  const formattedDate = item?.isoDate 
    ? new Date(item.isoDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '-';

  // 2. Handler untuk gambar rusak
  const handleImageError = (e) => {
    e.target.onerror = null; // Mencegah looping infinite
    e.target.src = 'https://via.placeholder.com/300x180?text=Berita+Indonesia';
  };

  return (
    <Col md={3} sm={6} className="mb-4 d-flex">
      <Link 
        to="/news-detail" 
        state={{ news: item }}
        className="text-decoration-none w-100" // w-100 agar link memenuhi kolom
        style={{ color: 'inherit' }}
      >
        <Card className="h-100 border-0 shadow-sm hover-card overflow-hidden">
          <div className="ratio ratio-16x9"> {/* Menjaga tinggi gambar konsisten */}
            <Card.Img
              variant="top"
              src={item.image?.small || item.image?.large || 'https://via.placeholder.com/300x180'}
              className="news-card-img object-fit-cover"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              alt={item.title}
            />
          </div>
          <Card.Body className="d-flex flex-column">
            <Card.Title 
              className="fs-6 fw-bold text-truncate-2 mb-auto" 
              style={{ minHeight: '2.8em' }} // Menjaga alignment judul
            >
              {item.title}
            </Card.Title>
            <div className="mt-3 pt-2 border-top">
              <span className="text-primary fw-bold small">{item.source || 'Berita'}</span>
              <small className="text-muted ms-2 border-start ps-2">
                {formattedDate}
              </small>
            </div>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
}, (prevProps, nextProps) => {
  // Hanya render ulang jika ID atau Link berubah
  return prevProps.item.link === nextProps.item.link;
});

export default NewsCard;
