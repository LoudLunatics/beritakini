import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Image, Form, Card, Placeholder } from 'react-bootstrap';
import { getNews } from '../api/newsApi';
import { POPULAR_NEWS_COUNT, RELATED_NEWS_COUNT } from '../constants/config';

const NewsDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { news } = location.state || {};
  const [popularNews, setPopularNews] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const fetchPageData = async () => {
      try {
        setLoadingExtra(true);
        const [cnnData, kumparanData] = await Promise.all([
          getNews('cnn-news', '', ac.signal),
          getNews('kumparan-news', '', ac.signal),
        ]);
        if (Array.isArray(cnnData)) setPopularNews(cnnData.slice(0, POPULAR_NEWS_COUNT).map(item => ({ ...item, source: 'CNN' })));
        if (Array.isArray(kumparanData)) setRelatedNews(kumparanData.slice(0, RELATED_NEWS_COUNT).map(item => ({ ...item, source: 'Kumparan' })));
      } catch (_) {
        setPopularNews([]);
        setRelatedNews([]);
      } finally {
        setLoadingExtra(false);
      }
    };
    fetchPageData();
    return () => ac.abort();
  }, [news?.link]);

  if (!news) {
    return (
      <Container className="py-5 text-center">
        <h4>Berita tidak ditemukan</h4>
        <Button onClick={() => navigate('/')} variant="primary">Kembali ke Beranda</Button>
      </Container>
    );
  }

  return (
    <div className="bg-white">
      <Container className="py-3 border-bottom mb-4">
        <small className="text-muted">
          Beranda &gt; {news.source || 'Nasional'} &gt; Detail
        </small>
      </Container>

      <Container className="pb-5">
        <Row>
          {/* --- KOLOM UTAMA (KIRI) --- */}
          <Col lg={8} className="pe-lg-5">
            <h1 className="fw-bold mb-3 h2">{news.title}</h1>
            <div className="mb-4 small text-muted">
              <span className="text-primary fw-bold me-2">Politik</span>
              <span>• {new Date(news.isoDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <Image
              src={news.image?.large || news.image?.small}
              fluid
              className="rounded-3 mb-3 w-100 shadow-sm news-detail-image"
              decoding="async"
              alt=""
            />

            <div className="content-area mb-5">
              <p>{news.contentSnippet}</p>
            </div>

            {/* Tombol Sumber */}
            <div className="bg-light p-4 rounded-3 mb-5 border-start border-primary border-4">
              <p className="mb-3">Ingin membaca berita lengkap secara detail? Anda bisa mengunjungi sumber aslinya:</p>
              <Button href={news.link} target="_blank" rel="noopener noreferrer" variant="primary" className="fw-bold px-4 shadow-sm">
                Baca Selengkapnya di Situs Sumber
              </Button>
            </div>

            {/* Kolom Komentar */}
            <div className="comment-section border-top pt-5 mb-5">
              <h5 className="fw-bold mb-4">Komentar</h5>
              <div className="d-flex mb-4">
                <Image src="https://via.placeholder.com/40" roundedCircle className="me-3 avatar-placeholder" />
                <div className="w-100">
                  <Form.Control as="textarea" rows={3} placeholder="Apa yang ingin anda tanyakan?" className="mb-2 bg-light border-0" />
                  <Button variant="primary" size="sm" className="px-3">Kirim</Button>
                </div>
              </div>
            </div>

            {/* Berita Terkait (Grid Bawah) */}
            <div className="related-news border-top pt-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold m-0">Berita Terkait</h5>
                <Button variant="outline-primary" size="sm">Lihat Semua</Button>
              </div>
              <Row>
                {loadingExtra ? (
                  // SKELETON RELATED NEWS
                  [1, 2, 3].map((i) => (
                    <Col md={4} key={i} className="mb-3">
                      <Card className="border-0 shadow-none">
                        <Placeholder as="div" animation="glow">
                          <Placeholder className="rounded-3 related-card-img" style={{ width: '100%' }} />
                        </Placeholder>
                        <Card.Body className="px-0 pt-3">
                          <Placeholder as={Card.Title} animation="glow">
                            <Placeholder xs={10} /> <Placeholder xs={6} />
                          </Placeholder>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  relatedNews.map((item, index) => (
                    <Col md={4} key={item.link || item.title || index} className="mb-3">
                      <Link 
                        to="/news-detail" 
                        state={{ news: item }}
                        className="text-decoration-none text-dark"
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        <Card className="border-0 shadow-sm h-100 hover-card rounded-3">
                          <Card.Img variant="top" loading="lazy" src={item.image?.small || item.image?.large} className="rounded-3 news-card-img related-card-img" />
                          <Card.Body className="px-2 pt-3">
                            <Card.Title className="h6 fw-bold text-truncate-2">{item.title}</Card.Title>
                            <small className="text-muted">{item.source} • {new Date(item.isoDate).toLocaleDateString('id-ID')}</small>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  ))
                )}
              </Row>
            </div>
          </Col>

          {/* --- SIDEBAR (KANAN) --- */}
          <Col lg={4} className="mt-5 mt-lg-0">
            <div className="sidebar-fixed">
              <div className="p-4 border rounded-4 bg-white shadow-sm">
                <h5 className="section-title mb-4">Berita Terpopuler</h5>
                
                {loadingExtra ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="d-flex mb-4 align-items-center">
                      <Placeholder as="div" animation="glow" className="me-3">
                        <Placeholder xs={12} style={{ width: '30px', height: '30px' }} />
                      </Placeholder>
                      <Placeholder as="div" animation="glow" className="me-3">
                        <Placeholder className="rounded-3 popular-thumbnail" />
                      </Placeholder>
                      <div className="w-100">
                        <Placeholder as="div" animation="glow">
                          <Placeholder xs={10} /> <Placeholder xs={7} />
                        </Placeholder>
                      </div>
                    </div>
                  ))
                ) : (
                  popularNews.map((item, index) => (
                    <Link 
                      to="/news-detail" 
                      state={{ news: item }} 
                      key={item.link || item.title || index} 
                      className="d-flex mb-4 position-relative align-items-start text-decoration-none text-dark hover-populer"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <div className="rank-number me-3 text-secondary fw-bold fs-3">{index + 1}</div>
                      <Image
                        src={item.image?.small || item.image?.large}
                        loading="lazy"
                        decoding="async"
                        className="me-3 rounded-3 popular-thumbnail"
                      />
                      <div>
                        <h6 className="fw-bold mb-1 small text-truncate-3 popular-title">
                          {item.title}
                        </h6>
                        <small className="text-primary small fw-bold">{item.source}</small>
                        <small className="text-muted small ms-2">• {new Date(item.isoDate).toLocaleDateString('id-ID')}</small>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NewsDetail;
