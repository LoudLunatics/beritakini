import { memo } from 'react';
import { Card, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NewsCard = memo(function NewsCard({ item }) {
  return (
    <Col md={3} sm={6} className="mb-4">
      <Link 
        to="/news-detail" 
        state={{ news: item }}
        className="text-decoration-none"
        style={{ color: 'inherit' }}
      >
        <Card className="h-100 border-0 shadow-sm hover-card">
          <Card.Img
            variant="top"
            src={item.image?.small || item.image?.large || 'https://via.placeholder.com/300x180'}
            className="news-card-img"
            loading="lazy"
            decoding="async"
          />
          <Card.Body>
            <Card.Title className="fs-6 fw-bold text-truncate-2">
              {item.title}
            </Card.Title>
            <div className="mt-2">
              <span className="text-primary fw-bold small">{item.source || 'Berita'}</span>
              <small className="text-muted ms-2 border-start ps-2">
                {new Date(item.isoDate).toLocaleDateString('id-ID')}
              </small>
            </div>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
});

export default NewsCard;