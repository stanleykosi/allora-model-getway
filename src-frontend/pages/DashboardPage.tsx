import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  BarChart3,
  Plus,
  Settings,
  Network,
  Wallet,
  TrendingUp,
  Activity,
  ArrowRight,
  Target,
  Zap,
  Globe,
  Award,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';


export default function DashboardPage() {
  console.log('🎯 DashboardPage component is rendering!');

  const { user } = useAuth();
  const api = useApi();

  // API functions
  const fetchUserModels = async (): Promise<any> => {
    console.log('📊 Fetching user models...');
    try {
      const { data } = await api.get('/api/v1/users/models');
      console.log('✅ User models fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch user models:', error);
      throw error;
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['userModels'],
    queryFn: fetchUserModels,
    onSuccess: (data) => {
      console.log('🎉 React Query success:', data);
    },
    onError: (error) => {
      console.error('💥 React Query error:', error);
    },
  });

  const models = data?.models || [];
  const activeModels = models.filter((model: any) => model.is_active);
  const inactiveModels = models.filter((model: any) => !model.is_active);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Dashboard</h2>
          <p className="text-text-secondary">Preparing your Allora Network overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load dashboard</h2>
          <p className="text-text-secondary mb-6">Please try again later.</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-primary to-accent">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <p className="text-sm sm:text-md md:text-lg text-text-secondary max-w-2xl mx-auto px-4">
            Welcome back! Here's your comprehensive overview of the Allora Network activity.
          </p>
        </div>

        {/* User Welcome Section */}
        <Card className="mb-6 sm:mb-8 border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-1 sm:mb-2">
                  Welcome back, {user?.firstName || 'User'}! 👋
                </h2>
                <p className="text-sm sm:text-base text-text-secondary md:text-lg">
                  Manage your models, monitor network activity, and track your performance across the Allora Network.
                </p>
              </div>
              <div className="text-center md:text-right mt-3 sm:mt-4 md:mt-0">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{models.length}</div>
                <div className="text-xs sm:text-sm text-text-secondary">Total Models</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Total Models</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{models.length}</p>
                <p className="text-xs text-text-secondary mt-1">Registered models</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Active Models</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-500">{activeModels.length}</p>
                <p className="text-xs text-text-secondary mt-1">Currently running</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Topics</p>
                <p className="text-2xl sm:text-3xl font-bold text-accent">
                  {new Set(models.map((m: any) => m.topic_id)).size}
                </p>
                <p className="text-xs text-text-secondary mt-1">Active topics</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Network className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Inactive Models</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-500">{inactiveModels.length}</p>
                <p className="text-xs text-text-secondary mt-1">Paused models</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link to="/models/register">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group h-full">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors flex-shrink-0">
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-base sm:text-lg truncate">Register Model</h3>
                    <p className="text-xs sm:text-sm text-text-secondary line-clamp-2">Add a new model to the network</p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/models/manage">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group h-full">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors flex-shrink-0">
                    <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-base sm:text-lg truncate">Manage Models</h3>
                    <p className="text-xs sm:text-sm text-text-secondary line-clamp-2">View and control your models</p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/network">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group h-full">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors flex-shrink-0">
                    <Network className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-base sm:text-lg truncate">Network</h3>
                    <p className="text-xs sm:text-sm text-text-secondary line-clamp-2">Monitor network activity</p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/wallet">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group h-full">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors flex-shrink-0">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-base sm:text-lg truncate">Wallet</h3>
                    <p className="text-xs sm:text-sm text-text-secondary line-clamp-2">Manage wallet & credentials</p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Recent Activity</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your latest model activity and network participation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {models.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2 sm:mb-3">No models registered yet</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  Get started by registering your first model to participate in the Allora Network and start earning rewards.
                </p>
                <Link to="/models/register">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-12 px-8">
                    <Plus className="h-5 w-5 mr-2" />
                    Register Your First Model
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {models.slice(0, 3).map((model: any) => (
                  <div key={model.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border border-border rounded-xl bg-surface/50 hover:bg-surface/80 transition-all group">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className={`w-4 h-4 rounded-full ${model.is_active ? 'bg-green-500' : 'bg-text-secondary/50'} group-hover:scale-110 transition-transform flex-shrink-0`} />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">
                            Model {model.id.substring(0, 8)}...
                          </h4>
                          <p className="text-sm text-text-secondary">
                            Topic {model.topic_id} • {model.model_type}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link to={`/models/${model.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-white transition-all w-full">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ))}
                {models.length > 3 && (
                  <div className="text-center pt-6">
                    <Link to="/models/manage">
                      <Button variant="outline" className="h-12 px-8">
                        View All Models
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
} 