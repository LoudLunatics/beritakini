import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';

const MyNavbar = () => {
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
    <Navbar bg="white" expand="lg" className="border-bottom sticky-top py-3 shadow-sm">
      <Container>
        {/* Brand Logo */}
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary fs-4">
          Berita Kini
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {categories.map((cat) => (
              <Nav.Link 
                key={cat.path} 
                as={NavLink} 
                to={cat.path}
                className={({ isActive }) => 
                  isActive ? "text-primary fw-bold mx-2 active-link" : "text-dark mx-2"
                }
              >
                {cat.name}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MyNavbar;