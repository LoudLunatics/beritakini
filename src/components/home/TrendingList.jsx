import { memo } from 'react';
import { Row, Col, Image } from 'react-bootstrap';
import { TRENDING_COUNT } from '../../constants/config';

const TrendingList = memo(function TrendingList({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="my-5">
      <h4 className="section-title mb-4">Berita Terpopuler</h4>
      <Row>
        {data.slice(0, TRENDING_COUNT).map((news, idx) => (
          <Col key={news.link || news.title || idx} md={4} className="d-flex align-items-start mb-3 trending-item">
            {/* Nomor urut besar */}
            <h1 className="trending-number me-3">{idx + 1}</h1>
            
            <div className="d-flex align-items-center bg-white p-2 rounded shadow-sm border w-100">
              {/* Gambar berita kecil (thumbnail) */}
              <Image
                src={news.image?.small || news.image?.large || 'https://via.placeholder.com/80x60'}
                width={80}
                height={60}
                rounded
                className="me-3 object-fit-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="overflow-hidden">
                <h6 className="mb-1 small fw-bold text-truncate-2">
                  {news.title}
                </h6>
                <small className="text-primary d-block text-uppercase trending-label">
                  Nasional
                </small>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
});

export default TrendingList;