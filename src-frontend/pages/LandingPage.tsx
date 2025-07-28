import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  Brain,
  Shield,
  Zap,
  BarChart3,
  Wallet,
  ArrowRight,
  Github,
  ExternalLink,
  Target,
  Network,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Globe,
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AlloraIcon from '../components/icons/AlloraIcon';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Model Registration",
      description: "Register your ML models with a simple API. Our gateway handles all the blockchain complexity, from wallet creation to transaction signing.",
      color: "from-blue-500 to-cyan-500",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: Wallet,
      title: "Wallet Management",
      description: "Each model gets its own dedicated wallet. We handle secure storage of mnemonics and automated fee payments for network participation.",
      color: "from-green-500 to-emerald-500",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: BarChart3,
      title: "Performance Monitoring",
      description: "Monitor your models' performance on the network with real-time metrics and automated data collection from the blockchain.",
      color: "from-purple-500 to-violet-500",
      gradient: "from-purple-500/20 to-violet-500/20"
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Enterprise-grade authentication with Google OAuth. Your data and wallet information are protected with industry-standard security.",
      color: "from-orange-500 to-red-500",
      gradient: "from-orange-500/20 to-red-500/20"
    },
    {
      icon: Zap,
      title: "Automated Operations",
      description: "Automated job scheduling, performance data collection, and blockchain interactions. Focus on your models, we handle the rest.",
      color: "from-indigo-500 to-blue-500",
      gradient: "from-indigo-500/20 to-blue-500/20"
    },
    {
      icon: Network,
      title: "Network Integration",
      description: "Seamless integration with the Allora Network. Real-time data feeds, automated predictions, and instant reward distribution.",
      color: "from-pink-500 to-rose-500",
      gradient: "from-pink-500/20 to-rose-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20">
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
            <div className="flex items-center">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-purple-500 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-300">
                  <AlloraIcon className="h-6 w-6 text-white" />
                </div>
              </div>
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
              <SignedOut>
                <Link to="/login">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25">
                    Get Started
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25">
                    Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <AlloraIcon className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-purple-500 bg-clip-text text-transparent">
                  Model Gateway
                </h1>
              </div>
              <p className="mt-8 text-xl md:text-2xl leading-relaxed text-text-secondary max-w-4xl mx-auto">
                The managed gateway for Data Scientists to participate in the{' '}
                <span className="text-primary font-semibold">Allora Network</span>.
                Register your ML models, manage wallets, and earn rewards seamlessly.
              </p>

              {/* Key Features */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="p-6 bg-surface/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300">
                  <div className="text-3xl font-bold text-primary">Ready</div>
                  <div className="text-sm text-text-secondary">Production Ready</div>
                </div>
                <div className="p-6 bg-surface/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-accent/30 transition-all duration-300">
                  <div className="text-3xl font-bold text-accent">Beta</div>
                  <div className="text-sm text-text-secondary">Early Access</div>
                </div>
                <div className="p-6 bg-surface/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-purple-500/30 transition-all duration-300">
                  <div className="text-3xl font-bold text-purple-500">Open</div>
                  <div className="text-sm text-text-secondary">Source Platform</div>
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <SignedOut>
                  <Link to="/login">
                    <Button size="lg" className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transform hover:scale-105 transition-all duration-300 h-14 px-8">
                      <span className="flex items-center gap-2 text-lg">
                        Get Started
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard">
                    <Button size="lg" className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transform hover:scale-105 transition-all duration-300 h-14 px-8">
                      <span className="flex items-center gap-2 text-lg">
                        Go to Dashboard
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </SignedIn>
                <a
                  href="https://docs.allora.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-lg font-semibold text-text-secondary hover:text-primary transition-all duration-300"
                >
                  Learn more
                  <ExternalLink className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
              Everything you need to participate in Allora Network
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Our gateway abstracts the complexities of blockchain interaction,
              allowing you to focus on what matters most - your ML models.
            </p>
          </div>

          {/* Interactive Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;

              return (
                <Card
                  key={feature.title}
                  className={`relative overflow-hidden border-0 shadow-2xl bg-surface/50 backdrop-blur-sm transition-all duration-500 hover:scale-105 cursor-pointer ${isActive ? 'ring-2 ring-primary/50 shadow-primary/25' : ''
                    }`}
                  onClick={() => setActiveFeature(index)}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : ''
                    }`} />

                  <CardContent className="relative p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.color} shadow-lg transition-all duration-300 ${isActive ? 'scale-110' : ''
                        }`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">{feature.title}</h3>
                      </div>
                    </div>
                    <p className="text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature Navigation Dots */}
          <div className="flex justify-center mt-12 gap-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${activeFeature === index
                  ? 'bg-primary scale-125'
                  : 'bg-border hover:bg-text-secondary'
                  }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
              How It Works
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Three simple steps to start earning rewards with your ML models
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Register Your Model",
                description: "Connect your ML model to our gateway with a simple API call. We'll create a dedicated wallet and handle all blockchain setup.",
                icon: Target,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "Monitor Performance",
                description: "Track your model's performance in real-time through our comprehensive dashboard. View predictions, rewards, and network activity.",
                icon: BarChart3,
                color: "from-green-500 to-emerald-500"
              },
              {
                step: "03",
                title: "Earn Rewards",
                description: "Automatically receive rewards for accurate predictions. Our system handles all transactions and distributes earnings seamlessly.",
                icon: TrendingUp,
                color: "from-purple-500 to-violet-500"
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative border-0 shadow-2xl bg-surface/50 backdrop-blur-sm p-8 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-primary mb-4">{step.step}</div>
                    <h3 className="text-xl font-bold text-text-primary mb-4">{step.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{step.description}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-surface/80 to-surface/60 backdrop-blur-xl">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-purple-500/10" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-purple-500" />

            <CardHeader className="relative text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <AlloraIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Ready to get started?
                </CardTitle>
              </div>
              <CardDescription className="text-xl text-text-secondary max-w-2xl mx-auto">
                Join the Allora Network and start earning rewards for your ML models.
                Get started in minutes, not hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative text-center pb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <SignedOut>
                  <Link to="/login">
                    <Button size="lg" className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transform hover:scale-105 transition-all duration-300 h-14 px-8">
                      <span className="flex items-center gap-2 text-lg">
                        Sign In to Get Started
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard">
                    <Button size="lg" className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transform hover:scale-105 transition-all duration-300 h-14 px-8">
                      <span className="flex items-center gap-2 text-lg">
                        Go to Dashboard
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </SignedIn>
                <div className="flex items-center gap-2 text-text-secondary">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Free to start • No credit card required</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
} 