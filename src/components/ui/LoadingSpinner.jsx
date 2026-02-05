const LoadingSpinner = () => (
  <div className="container py-5 text-center" role="status" aria-live="polite" aria-busy="true">
    <div className="spinner-border text-primary">
      <span className="visually-hidden">Memuat halaman...</span>
    </div>
  </div>
);

export default LoadingSpinner;
