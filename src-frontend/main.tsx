import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

console.log('🚀 React app starting...');

try {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  });

  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  console.log('🔑 Clerk publishable key:', PUBLISHABLE_KEY ? 'PRESENT' : 'MISSING');

  if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk Publishable Key");
  }

  console.log('🎯 About to render React app...');

  const rootElement = document.getElementById('root');
  console.log('🎯 Root element found:', !!rootElement);

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/login"
        fallbackRedirectUrl="/dashboard"
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#2D3748',
                  color: '#F7FAFC',
                },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkProvider>
    </React.StrictMode>,
  )

  console.log('✅ React app rendered!');
} catch (error) {
  console.error('💥 Fatal error in React app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Application Error</h1>
      <p>There was an error loading the application:</p>
      <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error.message}</pre>
      <p>Please check the console for more details.</p>
    </div>
  `;
} 