import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import MyNavbar from './components/layout/MyNavbar';
import MyFooter from './components/layout/MyFooter';
import LoadingSpinner from './components/ui/LoadingSpinner';

const Home = lazy(() => import('./pages/Home'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <MyNavbar />
        <main className="flex-grow-1">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/news-detail" element={<NewsDetail />} />
              <Route path="*" element={<Container className="mt-5 py-5 text-center text-muted">Halaman Tidak Ditemukan</Container>} />
            </Routes>
          </Suspense>
        </main>
        <MyFooter />
      </div>
    </Router>
  );
}

export default App;