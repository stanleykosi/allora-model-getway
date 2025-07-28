import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Github, ArrowLeft, Home, Search, Settings, Network, AlertTriangle } from 'lucide-react';
import AlloraIcon from '../components/icons/AlloraIcon';
import { useState, useEffect } from 'react';

export default function NotFoundPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-purple-500 opacity-50" />

      {/* Floating Elements */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000" />

      {/* Header */}
      <header className="relative border-b border-border/30 bg-surface/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <AlloraIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-surface animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Model Gateway
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/allora-network/allora-mcp-node"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface/50 transition-all duration-200"
              >
                <Github className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  GitHub
                </span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-surface/50 backdrop-blur-xl w-full max-w-2xl">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-purple-500/10" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-purple-500" />

            <CardHeader className="relative text-center pb-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-red-500/20">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <div className="text-8xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
                    404
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Page Not Found
                  </CardTitle>
                  <CardDescription className="text-lg text-text-secondary mt-2">
                    Sorry, the page you are looking for does not exist.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pb-8">
              <div className="text-center space-y-6">
                <p className="text-text-secondary max-w-md mx-auto">
                  The page you're looking for might have been moved, deleted, or you entered the wrong URL.
                  Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/dashboard">
                    <Button className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:scale-105 transition-all duration-300 h-12 px-6">
                      <span className="flex items-center gap-2 text-lg">
                        <Home className="h-5 w-5" />
                        Go to Dashboard
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>

                  <Link to="/">
                    <Button variant="outline" className="group border-border/50 hover:border-primary/50 bg-surface/50 backdrop-blur-sm hover:bg-surface/80 transition-all duration-300 h-12 px-6">
                      <span className="flex items-center gap-2 text-lg">
                        <Search className="h-5 w-5" />
                        Explore Home
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-8 pt-6 border-t border-border/30">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Navigation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { href: "/models/register", title: "Register Model", icon: AlloraIcon },
                      { href: "/models/manage", title: "Manage Models", icon: AlloraIcon },
                      { href: "/network", title: "Network", icon: AlloraIcon }
                    ].map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="group p-4 bg-surface/30 backdrop-blur-sm rounded-xl border border-border/30 hover:border-primary/50 hover:bg-surface/50 transition-all duration-300 text-center"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <link.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                          {link.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 