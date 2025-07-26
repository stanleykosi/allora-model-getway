import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Allora Logo" className="h-8 w-8" />
            <Link to="/" className="text-xl font-bold text-text-primary hover:text-primary transition-colors">
              Allora Gateway
            </Link>
          </div>

          {/* Navigation and Auth */}
          <div className="flex items-center gap-4">
            {/* GitHub Link - Always visible */}
            <a
              href="https://github.com/allora-network/allora-mcp-node"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              <Github className="h-5 w-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            {/* Signed Out State */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            {/* Signed In State */}
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-surface border border-border",
                    userButtonPopoverActionButton: "text-text-primary hover:bg-surface",
                    userButtonPopoverActionButtonText: "text-text-primary"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
} 