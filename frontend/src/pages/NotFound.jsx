import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        {/* Animated icon */}
        <div className="not-found-icon-wrapper">
          <div className="not-found-icon-ring" />
          <div className="not-found-icon-ring ring-2" />
          <SearchX className="not-found-icon" size={56} strokeWidth={1.5} />
        </div>

        {/* Error code */}
        <p className="not-found-code">404</p>

        {/* Heading */}
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="not-found-actions">
          <button
            id="not-found-go-home"
            className="button button-primary"
            onClick={() => navigate('/')}
          >
            <Home size={18} />
            Go to Dashboard
          </button>
          <button
            id="not-found-go-back"
            className="button button-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
