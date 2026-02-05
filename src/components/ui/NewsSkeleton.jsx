import { Row, Col, Card, Placeholder } from 'react-bootstrap';

const NewsSkeleton = ({ count = 8 }) => (
  <Row role="status" aria-label="Memuat berita">
    {Array.from({ length: Math.min(count, 24) }).map((_, index) => (
      <Col md={3} sm={6} className="mb-4" key={`skeleton-${index}`}>
        <Card className="h-100 border-0 shadow-sm" aria-hidden="true">
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} className="skeleton-card-image" />
          </Placeholder>
          <Card.Body>
            <Placeholder as={Card.Title} animation="glow" className="mb-3">
              <Placeholder xs={12} className="mb-1" />
              <Placeholder xs={8} />
            </Placeholder>
            <Placeholder as="div" animation="glow" className="d-flex align-items-center mt-2">
              <Placeholder xs={3} className="me-2" />
              <Placeholder xs={4} />
            </Placeholder>
          </Card.Body>
        </Card>
      </Col>
    ))}
  </Row>
);

export default NewsSkeleton;