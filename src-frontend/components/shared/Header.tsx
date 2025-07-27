import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Github,
  Sparkles,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  ArrowRight,
  Activity,
  Zap,
  LayoutDashboard,
  PlusCircle,
  Network,
  Wallet
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/models/register') return 'Register Model';
    if (path === '/models/manage') return 'Manage Models';
    if (path === '/network') return 'Network Monitor';
    if (path === '/wallet') return 'Wallet Management';
    return 'Allora Gateway';
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-surface/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5'
        : 'bg-surface/40 backdrop-blur-sm border-b border-border/30'
      }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-surface/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-text-primary" />
              ) : (
                <Menu className="h-5 w-5 text-text-primary" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-surface animate-pulse" />
              </div>

              <div className="hidden sm:block">
                <SignedIn>
                  <Link
                    to="/dashboard"
                    className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                  >
                    Allora Gateway
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/"
                    className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                  >
                    Allora Gateway
                  </Link>
                </SignedOut>
              </div>
            </div>

            {/* Page Title */}
            <div className="hidden md:flex items-center gap-2 ml-6 pl-6 border-l border-border/50">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-sm font-medium text-text-secondary">
                {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
              <Search className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                Search
              </span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
              <Bell className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
            </button>

            {/* GitHub Link */}
            <a
              href="https://github.com/allora-network/allora-mcp-node"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group"
            >
              <Github className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                GitHub
              </span>
            </a>

            {/* Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-500">Online</span>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-2">
              {/* Signed Out State */}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:scale-105">
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </SignInButton>
              </SignedOut>

              {/* Signed In State */}
              <SignedIn>
                <div className="flex items-center gap-3">
                  {/* Quick Actions */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
                      <Settings className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
                      <Activity className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
                    </button>
                  </div>

                  {/* User Button */}
                  <div className="relative">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-300",
                          userButtonPopoverCard: "bg-surface/95 backdrop-blur-xl border border-border/50 shadow-2xl",
                          userButtonPopoverActionButton: "text-text-primary hover:bg-surface/80 transition-all duration-200",
                          userButtonPopoverActionButtonText: "text-text-primary",
                          userButtonPopoverFooter: "border-t border-border/50"
                        }
                      }}
                    />
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-surface/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Navigation */}
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link
                  to="/models/register"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <PlusCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Register Model</span>
                </Link>
                <Link
                  to="/models/manage"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Manage Models</span>
                </Link>
                <Link
                  to="/network"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Network className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Network</span>
                </Link>
                <Link
                  to="/wallet"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Wallet</span>
                </Link>
              </div>

              {/* Mobile GitHub Link */}
              <div className="pt-3 border-t border-border/50">
                <a
                  href="https://github.com/allora-network/allora-mcp-node"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                >
                  <Github className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">View on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 