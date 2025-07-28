import { Route, Routes, useLocation } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import Layout from './components/shared/Layout'
import DashboardPage from './pages/DashboardPage'
import RegisterModelPage from './pages/RegisterModelPage'
import ModelDetailPage from './pages/ModelDetailPage'
import ManageModelsPage from './pages/ManageModelsPage'
import NetworkPage from './pages/NetworkPage'
import WalletManagementPage from './pages/WalletManagementPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import { Button } from './components/ui/Button'

console.log('📱 App component loading...');

function FallbackError({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  console.error('💥 App error:', error);
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background" role="alert">
      <h2 className="text-2xl font-semibold text-error">Something went wrong</h2>
      <pre className="my-4 rounded-md bg-surface p-4 text-sm text-text-primary">{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  )
}

function ComponentError({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  console.error('💥 Component error:', error);
  return (
    <div className="flex h-64 items-center justify-center" role="alert">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-error mb-2">Component Error</h2>
        <pre className="text-sm text-text-secondary mb-4">{error.message}</pre>
        <Button onClick={resetErrorBoundary}>Retry</Button>
      </div>
    </div>
  )
}

function App() {
  console.log('🎯 App component rendering...');

  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  console.log('🔐 Auth state - isSignedIn:', isSignedIn, 'isLoaded:', isLoaded);
  console.log('📍 Current location:', location.pathname);

  return (
    <ErrorBoundary FallbackComponent={FallbackError}>
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Landing page - shows different content based on auth state */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes - only accessible when signed in */}
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <div className="flex h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="mb-4">You need to be signed in to access the dashboard.</p>
                    <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
                  </div>
                </div>
              </SignedOut>
            </>
          }
        >
          <Route index element={
            <ErrorBoundary FallbackComponent={ComponentError}>
              <DashboardPage />
            </ErrorBoundary>
          } />
        </Route>

        <Route
          path="/models/register"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <div className="flex h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="mb-4">You need to be signed in to register models.</p>
                    <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
                  </div>
                </div>
              </SignedOut>
            </>
          }
        >
          <Route index element={
            <ErrorBoundary FallbackComponent={ComponentError}>
              <RegisterModelPage />
            </ErrorBoundary>
          } />
        </Route>

        <Route
          path="/models/manage"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <div className="flex h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="mb-4">You need to be signed in to manage models.</p>
                    <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
                  </div>
                </div>
              </SignedOut>
            </>
          }
        >
          <Route index element={
            <ErrorBoundary FallbackComponent={ComponentError}>
              <ManageModelsPage />
            </ErrorBoundary>
          } />
        </Route>

        <Route
          path="/network"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <div className="flex h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="mb-4">You need to be signed in to view network data.</p>
                    <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
                  </div>
                </div>
              </SignedOut>
            </>
          }
        >
          <Route index element={
            <ErrorBoundary FallbackComponent={ComponentError}>
              <NetworkPage />
            </ErrorBoundary>
          } />
        </Route>

        <Route
          path="/wallet"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <div className="flex h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="mb-4">You need to be signed in to access wallet management.</p>
                    <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
                  </div>
                </div>
              </SignedOut>
            </>
          }
        >
          <Route index element={
            <ErrorBoundary FallbackComponent={ComponentError}>
              <WalletManagementPage />
            </ErrorBoundary>
          } />
        </Route>

        <Route
          path="/models/:modelId"
          element={
            <>
              <SignedIn>
                <Layout />
              </SignedIn>
              <SignedOut>
                <div className="flex h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="mb-4">You need to be signed in to view model details.</p>
                    <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
                  </div>
                </div>
              </SignedOut>
            </>
          }
        >
          <Route index element={
            <ErrorBoundary FallbackComponent={ComponentError}>
              <ModelDetailPage />
            </ErrorBoundary>
          } />
        </Route>

        {/* Catch-all route */}
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App 