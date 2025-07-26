import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return isSignedIn ? <Outlet /> : <Navigate to="/login" replace />;
} 