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
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Allora Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-text-primary">Allora Gateway</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/allora-network/allora-mcp-node"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <Github className="h-5 w-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <SignedOut>
                <Link to="/login">
                  <Button>Get Started</Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              Allora Gateway
            </h1>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              The managed gateway for Data Scientists to participate in the Allora Network.
              Register your ML models, manage wallets, and earn rewards seamlessly.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignedOut>
                <Link to="/login">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button size="lg">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
              <a
                href="https://docs.allora.network"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold leading-6 text-text-secondary hover:text-text-primary"
              >
                Learn more <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Everything you need to participate in Allora Network
            </h2>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              Our gateway abstracts the complexities of blockchain interaction,
              allowing you to focus on what matters most - your ML models.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-text-primary">
                  <Brain className="h-5 w-5 flex-none text-primary" />
                  Model Registration
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-secondary">
                  <p className="flex-auto">
                    Register your ML models with a simple API. Our gateway handles all the
                    blockchain complexity, from wallet creation to transaction signing.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-text-primary">
                  <Wallet className="h-5 w-5 flex-none text-primary" />
                  Wallet Management
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-secondary">
                  <p className="flex-auto">
                    Each model gets its own dedicated wallet. We handle secure storage
                    of mnemonics and automated fee payments for network participation.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-text-primary">
                  <BarChart3 className="h-5 w-5 flex-none text-primary" />
                  Performance Monitoring
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-secondary">
                  <p className="flex-auto">
                    Monitor your models' performance on the network with real-time
                    metrics and automated data collection from the blockchain.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-text-primary">
                  <Shield className="h-5 w-5 flex-none text-primary" />
                  Secure Authentication
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-secondary">
                  <p className="flex-auto">
                    Enterprise-grade authentication with Google OAuth. Your data and
                    wallet information are protected with industry-standard security.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-text-primary">
                  <Zap className="h-5 w-5 flex-none text-primary" />
                  Automated Operations
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-secondary">
                  <p className="flex-auto">
                    Automated job scheduling, performance data collection, and
                    blockchain interactions. Focus on your models, we handle the rest.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-text-primary">
                  <BarChart3 className="h-5 w-5 flex-none text-primary" />
                  Dashboard Analytics
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-secondary">
                  <p className="flex-auto">
                    Comprehensive dashboard with real-time analytics, model status,
                    and performance metrics. Everything you need in one place.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-text-primary">
                Ready to get started?
              </CardTitle>
              <CardDescription className="text-lg text-text-secondary">
                Join the Allora Network and start earning rewards for your ML models.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <SignedOut>
                <Link to="/login">
                  <Button size="lg">
                    Sign In to Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button size="lg">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
} 