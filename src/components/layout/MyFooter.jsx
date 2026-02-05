import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const MyFooter = () => {
  const socialLinks = [
    { icon: 'youtube', url: '#' },
    { icon: 'instagram', url: '#' },
    { icon: 'facebook', url: '#' },
  ];

  // Kategori sekarang sinkron dengan Navbar
  const categories = [
    { name: 'Terbaru', path: '/' },
    { name: 'Nasional', path: '/category/nasional' },
    { name: 'Internasional', path: '/category/internasional' },
    { name: 'Ekonomi', path: '/category/ekonomi' },
    { name: 'Olahraga', path: '/category/olahraga' },
    { name: 'Teknologi', path: '/category/teknologi' },
    { name: 'Hiburan', path: '/category/hiburan' },
    { name: 'Gaya Hidup', path: '/category/gaya-hidup' },
  ];

  return (
    <footer className="footer-custom pt-5 pb-4 mt-auto">
      <Container>
        <Row className="gy-4">
          {/* Kolom 1: Logo & Copyright */}
          <Col lg={3} md={6}>
            <div className="d-flex align-items-center mb-3">
              <div className="footer-logo-box me-2">
                <i className="bi bi-grid-fill"></i>
              </div>
              <h4 className="fw-bold mb-0 text-white">Berita Kini</h4>
            </div>
            <p className="footer-text mb-4">© 2026 Berita Kini. All Rights Reserved.</p>
            
            <h6 className="fw-bold text-white mb-3">Ikuti Kami</h6>
            <div className="d-flex gap-3">
              {socialLinks.map((social, index) => (
                <a key={index} href={social.url} className="footer-social-icon">
                  <i className={`bi bi-${social.icon}`}></i>
                </a>
              ))}
            </div>
          </Col>

          {/* Kolom 2: Telusuri (Link yang sudah disesuaikan) */}
          <Col lg={2} md={3} className="offset-lg-1">
            <h6 className="fw-bold text-white mb-4">Telusuri</h6>
            <ul className="list-unstyled footer-links">
              {categories.map((cat) => (
                <li key={cat.path}>
                  <Link to={cat.path}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Kolom 3: Bantuan */}
          <Col lg={2} md={3}>
            <h6 className="fw-bold text-white mb-4">Bantuan</h6>
            <ul className="list-unstyled footer-links">
              <li><Link to="#">Kontak Kami</Link></li>
              <li><Link to="#">Laporan Pembajakan</Link></li>
              <li><Link to="#">Kebijakan</Link></li>
            </ul>
          </Col>

          {/* Kolom 4: Berlangganan */}
          <Col lg={4} md={12}>
            <h6 className="fw-bold text-white mb-4">Berlangganan Berita Terbaru</h6>
            <Form>
              <InputGroup className="footer-input-group mb-3">
                <Form.Control
                  placeholder="Masukkan email"
                  aria-label="Email"
                  className="footer-input"
                />
                <Button variant="primary" className="footer-btn">
                  <i className="bi bi-send-fill"></i>
                </Button>
              </InputGroup>
            </Form>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default MyFooter;