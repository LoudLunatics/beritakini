import { Carousel, Row, Col, Container } from 'react-bootstrap';

const HeroCarousel = ({ data }) => {
  return (
    <Carousel 
      controls={false} 
      indicators={true} 
      interval={5000} 
      pause="hover" 
      className="my-4 custom-hero-carousel"
    >
      {data.slice(0, 3).map((news, idx) => (
        <Carousel.Item key={news.link || idx}>
          <Container className="bg-light p-0 rounded-4 overflow-hidden shadow-sm">
            <Row className="align-items-stretch g-0">
              <Col md={5} className="p-5 d-flex flex-column justify-content-center">
                <h2 className="fw-bold text-truncate-3">{news.title}</h2>
                <p className="text-muted mt-3 text-truncate-3">{news.contentSnippet}</p>
                <div className="mt-auto pt-4">
                  <small className="text-secondary d-block">
                    📅 {new Date(news.isoDate).toLocaleDateString('id-ID')}
                  </small>
                  <a href={news.link} target="_blank" rel="noopener noreferrer" className="btn btn-link p-0 mt-2 text-decoration-none fw-bold">
                    Baca Selengkapnya ↗
                  </a>
                </div>
              </Col>
              <Col md={7}>
                <div className="hero-image-container">
                  <img
                    className="w-100 h-100 object-fit-cover"
                    src={news.image?.large || news.image?.small || 'https://via.placeholder.com/800x450'}
                    alt={news.title}
                    decoding="async"
                    fetchPriority={idx === 0 ? 'high' : undefined}
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default HeroCarousel;