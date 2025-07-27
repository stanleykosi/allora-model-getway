import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Network,
  Wallet,
  Github,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home,
  Zap,
  Target,
  Globe,
  Shield,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navLinks = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & analytics',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Register Model',
    href: '/models/register',
    icon: PlusCircle,
    description: 'Add new model',
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'Manage Models',
    href: '/models/manage',
    icon: Settings,
    description: 'Control your models',
    color: 'from-purple-500 to-violet-500'
  },
  {
    name: 'Network',
    href: '/network',
    icon: Network,
    description: 'Monitor activity',
    color: 'from-orange-500 to-red-500'
  },
  {
    name: 'Wallet Management',
    href: '/wallet',
    icon: Wallet,
    description: 'Manage credentials',
    color: 'from-indigo-500 to-blue-500'
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface/80 backdrop-blur-sm rounded-lg border border-border/50 hover:bg-surface/100 transition-all duration-300"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 h-full
        ${isCollapsed ? 'w-16' : 'w-80'} 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
        flex flex-col border-r border-border/50 
        bg-gradient-to-b from-surface/90 via-surface/70 to-surface/50 backdrop-blur-xl
        overflow-hidden
      `}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-purple-500 opacity-50" />

        {/* Content Container */}
        <div className="flex flex-col h-full relative">
          {/* Collapse Toggle Button - Positioned outside content flow */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-4 right-2 lg:flex hidden p-1.5 bg-surface/80 backdrop-blur-sm rounded-lg border border-border/50 hover:bg-surface/100 transition-all duration-300 z-20"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          {/* Main Content */}
          <div className="flex flex-col h-full p-4 lg:p-6 pt-12 lg:pt-6">
            {/* Logo Section */}
            <div className="relative mb-8">
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-surface animate-pulse" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                      Allora Gateway
                    </h1>
                    <p className="text-xs text-text-secondary truncate">Model Gateway</p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-4" />
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              {!isCollapsed && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h3>
                </div>
              )}

              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.href;
                const isHovered = hoveredIndex === index;

                return (
                  <div key={link.name} className="relative">
                    {/* Hover Background Effect */}
                    {isHovered && !isCollapsed && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur-sm transition-all duration-300" />
                    )}

                    <NavLink
                      to={link.href}
                      className={`relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group ${isActive
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-lg shadow-primary/20 border border-primary/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-transparent hover:border-border/50'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      title={isCollapsed ? link.name : undefined}
                    >
                      {/* Icon Container */}
                      <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${isActive
                          ? `bg-gradient-to-br ${link.color} shadow-lg`
                          : 'bg-surface/50 group-hover:bg-surface/80'
                        }`}>
                        <link.icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-primary'
                          }`} />

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-surface animate-pulse" />
                        )}
                      </div>

                      {/* Text Content */}
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{link.name}</div>
                          <div className={`text-xs transition-all duration-300 truncate ${isActive ? 'text-primary/70' : 'text-text-secondary/60 group-hover:text-text-secondary'
                            }`}>
                            {link.description}
                          </div>
                        </div>
                      )}

                      {/* Arrow Indicator */}
                      {!isCollapsed && (
                        <div className={`transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                          }`}>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </NavLink>
                  </div>
                );
              })}
            </nav>

            {/* Bottom Section */}
            <div className="mt-auto space-y-4">
              {/* Divider */}
              {!isCollapsed && (
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              )}

              {/* GitHub Link */}
              <div className="relative">
                <a
                  href="https://github.com/allora-network/allora-mcp-node"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary transition-all duration-300 hover:bg-surface/50 hover:text-text-primary border border-transparent hover:border-border/50 ${isCollapsed ? 'justify-center px-2' : ''
                    }`}
                  title={isCollapsed ? 'GitHub' : undefined}
                >
                  <div className="w-10 h-10 bg-surface/50 rounded-lg flex items-center justify-center group-hover:bg-surface/80 transition-all duration-300 flex-shrink-0">
                    <Github className="h-5 w-5 group-hover:text-primary transition-colors" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1">
                        <div className="font-semibold truncate">View on GitHub</div>
                        <div className="text-xs text-text-secondary/60 truncate">Open source</div>
                      </div>
                      <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </>
                  )}
                </a>
              </div>

              {/* Status Indicator */}
              <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 ${isCollapsed ? 'justify-center px-2' : ''
                }`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-green-500 truncate">System Online</div>
                    <div className="text-xs text-text-secondary/60 truncate">All services operational</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 