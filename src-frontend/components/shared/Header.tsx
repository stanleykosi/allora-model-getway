import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Github,
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
import AlloraIcon from '../icons/AlloraIcon';

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
    return 'Model Gateway';
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
      ? 'bg-surface/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5'
      : 'bg-surface/40 backdrop-blur-sm border-b border-border/30'
      }`}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Left Section - Current Context */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-surface/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-text-primary" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-text-primary" />
              )}
            </button>

            {/* Current Page Context */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
                <span className="text-base sm:text-xl font-bold text-text-primary">
                  {getPageTitle()}
                </span>
              </div>

              {/* Mobile - Just show page title */}
              <div className="sm:hidden">
                <span className="text-sm sm:text-lg font-semibold text-text-primary">
                  {getPageTitle()}
                </span>
              </div>
            </div>

            {/* Breadcrumb or Context Info */}
            <div className="hidden md:flex items-center gap-2 ml-3 sm:ml-4 pl-3 sm:pl-4 border-l border-border/20">
              <span className="text-xs sm:text-sm text-text-secondary/70 font-medium">
                {location.pathname === '/dashboard' && 'Overview & Analytics'}
                {location.pathname === '/models/register' && 'Add New Model'}
                {location.pathname === '/models/manage' && 'Model Management'}
                {location.pathname === '/network' && 'Network Activity'}
                {location.pathname === '/wallet' && 'Wallet & Credentials'}
              </span>
            </div>
          </div>

          {/* Right Section - Actions & Status */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Actions */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Search */}
              <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-secondary group-hover:text-primary transition-colors" />
                <span className="text-xs sm:text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  Search
                </span>
              </button>

              {/* GitHub */}
              <a
                href="https://github.com/stanleykosi/allora-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-surface/50 transition-all duration-200 group"
              >
                <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-secondary group-hover:text-primary transition-colors" />
                <span className="text-xs sm:text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  GitHub
                </span>
              </a>
            </div>

            {/* Notifications */}
            <button className="relative p-1.5 sm:p-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-secondary group-hover:text-primary transition-colors" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
            </button>

            {/* Connection Status */}
            <div className="hidden lg:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-xs font-medium text-primary">
                CONNECTED
              </span>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
              {/* Signed Out State */}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="group relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-sm sm:text-base font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                    <span className="flex items-center gap-1 sm:gap-2">
                      Sign In
                      <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </SignInButton>
              </SignedOut>

              {/* Signed In State */}
              <SignedIn>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Quick Actions */}
                  <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-secondary group-hover:text-primary transition-colors" />
                    </button>
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-surface/50 transition-all duration-200 group">
                      <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-secondary group-hover:text-primary transition-colors" />
                    </button>
                  </div>

                  {/* User Button */}
                  <div className="relative">
                    <UserButton />
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-surface/95 backdrop-blur-xl">
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
              {/* Mobile Navigation */}
              <div className="space-y-1 sm:space-y-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Dashboard</span>
                </Link>
                <Link
                  to="/models/register"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Register Model</span>
                </Link>
                <Link
                  to="/models/manage"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Manage Models</span>
                </Link>
                <Link
                  to="/network"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Network className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Network</span>
                </Link>
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Wallet</span>
                </Link>
              </div>

              {/* Mobile GitHub Link */}
              <div className="pt-2 sm:pt-3 border-t border-border/50">
                <a
                  href="https://github.com/stanleykosi/allora-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface/50 transition-colors"
                >
                  <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">View on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 