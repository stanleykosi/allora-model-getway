import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <div className="text-center space-y-6 sm:space-y-8 max-w-xs sm:max-w-md">
        {/* 404 Icon and Number */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surface rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-error" />
            </div>
          </div>
          <div className="text-4xl sm:text-6xl font-bold text-text-primary">404</div>
        </div>

        {/* Message */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Page Not Found</h1>
          <p className="text-sm sm:text-base text-text-secondary px-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-4 sm:px-0">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button className="bg-primary hover:bg-primary/90 w-full text-sm sm:text-base py-1.5 sm:py-2 h-auto">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full text-sm sm:text-base py-1.5 sm:py-2 h-auto">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 