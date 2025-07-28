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
        appearance={{
          baseTheme: undefined,
          variables: {
            // Color scheme
            colorPrimary: '#4299E1', // Our primary blue
            colorSuccess: '#38B2AC', // Our accent teal
            colorWarning: '#ED8936',
            colorDanger: '#F56565', // Our error red
            colorNeutral: '#A0AEC0', // Our text-secondary
            colorBackground: '#1A202C', // Our background
            colorInputBackground: '#2D3748', // Our surface
            colorInputText: '#F7FAFC', // Our text-primary
            colorText: '#F7FAFC', // Our text-primary
            colorTextSecondary: '#A0AEC0', // Our text-secondary
            colorTextOnPrimaryBackground: '#1A202C',

            // Sizing
            borderRadius: '0.75rem', // 12px, matches our rounded-xl
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.875rem', // 14px
            fontWeight: {
              normal: '400',
              medium: '500',
              semibold: '600',
              bold: '700'
            }
          },
          elements: {
            // Root modal container
            modalContent: {
              backgroundColor: '#2D3748', // surface
              border: '1px solid rgba(66, 153, 225, 0.2)', // primary/20
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(66, 153, 225, 0.25)',
              backdropFilter: 'blur(16px)'
            },

            // Header section
            headerTitle: {
              color: '#F7FAFC', // text-primary
              fontSize: '1.25rem',
              fontWeight: '600'
            },
            headerSubtitle: {
              color: '#A0AEC0', // text-secondary
              fontSize: '0.875rem'
            },

            // Card containers
            card: {
              backgroundColor: '#2D3748', // surface
              border: '1px solid rgba(66, 153, 225, 0.1)',
              borderRadius: '0.75rem',
              boxShadow: 'none'
            },
            cardBox: {
              backgroundColor: '#2D3748'
            },

            // Form elements
            formButtonPrimary: {
              backgroundColor: '#4299E1', // primary
              color: '#1A202C',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              padding: '0.75rem 1.5rem',
              border: 'none',
              '&:hover': {
                backgroundColor: '#3182CE' // primary darker
              },
              '&:focus': {
                boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.5)'
              }
            },

            formFieldInput: {
              backgroundColor: '#1A202C', // background (darker than surface)
              border: '1px solid rgba(160, 174, 192, 0.2)', // text-secondary/20
              borderRadius: '0.5rem',
              color: '#F7FAFC', // text-primary
              fontSize: '0.875rem',
              padding: '0.75rem',
              '&:focus': {
                border: '1px solid #4299E1', // primary
                boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.2)',
                outline: 'none'
              },
              '&::placeholder': {
                color: '#A0AEC0' // text-secondary
              }
            },

            formFieldLabel: {
              color: '#F7FAFC', // text-primary
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            },

            // Links and buttons
            footerActionLink: {
              color: '#4299E1', // primary
              fontSize: '0.875rem',
              fontWeight: '500',
              '&:hover': {
                color: '#38B2AC' // accent
              }
            },

            // Dividers
            dividerLine: {
              backgroundColor: 'rgba(160, 174, 192, 0.2)' // text-secondary/20
            },
            dividerText: {
              color: '#A0AEC0', // text-secondary
              fontSize: '0.75rem',
              fontWeight: '500'
            },

            // Profile section (user button dropdown)
            userButtonPopoverCard: {
              backgroundColor: '#2D3748', // surface
              border: '1px solid rgba(66, 153, 225, 0.2)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(16px)'
            },

            userButtonPopoverActionButton: {
              color: '#F7FAFC', // text-primary
              '&:hover': {
                backgroundColor: 'rgba(66, 153, 225, 0.1)', // primary/10
                color: '#4299E1' // primary
              }
            },

            userButtonPopoverActionButtonText: {
              color: '#F7FAFC' // text-primary
            },

            userButtonPopoverActionButtonIcon: {
              color: '#A0AEC0' // text-secondary
            },

            userButtonPopoverFooter: {
              borderTop: '1px solid rgba(160, 174, 192, 0.2)', // text-secondary/20
              backgroundColor: 'rgba(45, 55, 72, 0.5)' // surface/50
            },

            // Avatar
            avatarBox: {
              border: '2px solid rgba(66, 153, 225, 0.3)' // primary/30
            },

            // Badge
            badge: {
              backgroundColor: '#38B2AC', // accent
              color: '#1A202C',
              fontSize: '0.75rem',
              fontWeight: '600'
            }
          }
        }}
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