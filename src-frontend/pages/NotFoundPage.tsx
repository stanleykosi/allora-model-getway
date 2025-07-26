import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-text-primary">Page Not Found</h2>
      <p className="mt-2 text-text-secondary">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link to="/" className="mt-6">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
} 