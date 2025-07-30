import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Network,
  Wallet,
  Github,
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
import AlloraIcon from '../icons/AlloraIcon';

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
        className="lg:hidden fixed top-3 sm:top-4 left-3 sm:left-4 z-50 p-1.5 sm:p-2 bg-surface/80 backdrop-blur-sm rounded-lg border border-border/50 hover:bg-surface/100 transition-all duration-300 shadow-md"
      >
        {isMobileOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative z-50 h-full
        ${isCollapsed ? 'w-14 sm:w-16' : 'w-64 sm:w-72 md:w-80'} 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
        flex flex-col border-r border-border/50 
        bg-gradient-to-b from-surface/90 via-surface/70 to-surface/50 backdrop-blur-xl
        overflow-hidden shadow-lg
          ${isCollapsed ? 'hover:w-64 sm:hover:w-72 md:hover:w-80' : ''}
        `}
        onMouseEnter={() => {
          if (isCollapsed) {
            // Don't auto-expand on mobile
            if (window.innerWidth >= 1024) {
              setIsCollapsed(false);
            }
          }
        }}
        onMouseLeave={() => {
          if (!isCollapsed && window.innerWidth >= 1024) {
            // Only auto-collapse if we're not on mobile and not manually expanded
            setIsCollapsed(true);
          }
        }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-purple-500 opacity-50" />

        {/* Content Container */}
        <div className="flex flex-col h-full relative">
          {/* Main Content */}
          <div className="flex flex-col h-full p-4 lg:p-6 pt-12 lg:pt-6">
            {/* Logo Section */}
            <div className="relative mb-6 sm:mb-8">
              <div className={`flex items-center gap-2 sm:gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className={`${isCollapsed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-gradient-to-br from-primary via-accent to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20`}>
                    <AlloraIcon className={`${isCollapsed ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} text-white`} />
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary via-accent to-purple-500 bg-clip-text text-transparent truncate">
                      Model Gateway
                    </h1>
                    <p className="text-xs text-text-secondary/80 font-medium tracking-widest uppercase truncate">
                      Enterprise Platform
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4 sm:mt-6" />
              )}
            </div>

            {/* Navigation */}
            <nav className={`flex-1 ${isCollapsed ? 'space-y-2 sm:space-y-3 flex flex-col items-center' : 'space-y-1 sm:space-y-2'}`}>
              {!isCollapsed && (
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 sm:mb-3 px-2">
                    Navigation
                  </h3>
                </div>
              )}

              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.href;
                const isHovered = hoveredIndex === index;

                return (
                  <div key={link.name} className={`relative ${isCollapsed ? 'w-full flex justify-center' : ''}`}>
                    {/* Hover Background Effect */}
                    {isHovered && !isCollapsed && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur-sm transition-all duration-300" />
                    )}

                    <NavLink
                      to={link.href}
                      className={`relative flex items-center gap-3 sm:gap-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 group ${isActive
                        ? 'text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-transparent hover:border-border/50'
                        } ${isCollapsed
                          ? 'justify-center w-10 h-10 sm:w-12 sm:h-12'
                          : 'px-3 sm:px-4 py-2 sm:py-3'
                        }`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      title={isCollapsed ? link.name : undefined}
                    >
                      {/* Icon Container */}
                      <div
                        className={`relative rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10'
                          } ${isActive
                            ? `bg-gradient-to-br ${link.color} shadow-lg`
                            : 'bg-surface/50 group-hover:bg-surface/80'
                          }`}
                      >
                        <link.icon
                          className={`${isCollapsed ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4 sm:h-5 sm:w-5'} transition-all duration-300 ${isActive
                            ? 'text-white'
                            : 'text-text-secondary group-hover:text-primary'
                            }`}
                        />
                      </div>

                      {/* Text Content */}
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-xs sm:text-sm">{link.name}</div>
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
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                      )}
                    </NavLink>
                  </div>
                );
              })}
            </nav>

            {/* Bottom Section */}
            <div className={`mt-auto ${isCollapsed ? 'space-y-2 sm:space-y-3 flex flex-col items-center' : 'space-y-3 sm:space-y-4'}`}>
              {/* Divider */}
              {!isCollapsed && (
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              )}

              {/* GitHub Link */}
              <div className={`relative ${isCollapsed ? 'w-full flex justify-center' : ''}`}>
                <a
                  href="https://github.com/stanleykosi/allora-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-3 sm:gap-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-text-secondary transition-all duration-300 hover:bg-surface/50 hover:text-text-primary border border-transparent hover:border-border/50 ${isCollapsed ? 'justify-center w-10 h-10 sm:w-12 sm:h-12' : 'px-3 sm:px-4 py-2 sm:py-3'
                    }`}
                  title={isCollapsed ? 'GitHub' : undefined}
                >
                  <div
                    className={`rounded-lg flex items-center justify-center group-hover:bg-surface/80 transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10'
                      } bg-surface/50`}
                  >
                    <Github className={`${isCollapsed ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4 sm:h-5 sm:w-5'} group-hover:text-primary transition-colors`} />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1">
                        <div className="font-semibold truncate text-xs sm:text-sm">View on GitHub</div>
                        <div className="text-xs text-text-secondary/60 truncate">
                          Open source
                        </div>
                      </div>
                      <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 