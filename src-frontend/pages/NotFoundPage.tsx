import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* 404 Icon and Number */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
          </div>
          <div className="text-6xl font-bold text-text-primary">404</div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Page Not Found</h1>
          <p className="text-text-secondary">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 