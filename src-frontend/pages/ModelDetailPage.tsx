import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { PerformanceMetricsResponse } from '@/lib/types';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Target,
  Activity,
  Zap,
  ArrowRight,
  Calendar,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import AlloraIcon from '../components/icons/AlloraIcon';

export default function ModelDetailPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!modelId) {
    navigate('/not-found');
    return null;
  }

  const fetchPerformanceHistory = async (modelId: string): Promise<PerformanceMetricsResponse> => {
    try {
      const { data } = await api.get(`/api/v1/models/${modelId}/performance`);
      return data;
    } catch (error: any) {
      // If model not found (404) or other API errors, redirect to not found page
      if (error.response?.status === 404 || error.message?.includes('not found')) {
        navigate('/not-found');
        throw error;
      }
      throw error;
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['performanceHistory', modelId],
    queryFn: () => fetchPerformanceHistory(modelId),
    retry: false, // Don't retry on failure - if it fails once, likely invalid model ID
  });

  const chartData = data?.performance_metrics.map(d => ({
    ...d,
    timestamp: new Date(d.timestamp).toLocaleDateString(),
    ema_score: parseFloat(d.ema_score)
  })).reverse();

  // Calculate performance stats
  const latestScore = chartData?.[0]?.ema_score || 0;
  const averageScore = chartData?.reduce((sum, item) => sum + item.ema_score, 0) / (chartData?.length || 1);
  const trend = chartData && chartData.length > 1 ? chartData[0].ema_score - chartData[1].ema_score : 0;

  return (
    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {/* Back Button */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="group bg-surface/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-surface/80 transition-all duration-300 text-sm sm:text-base py-1.5 sm:py-2 h-auto"
        >
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>
      </div>

      {/* Enhanced Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm border border-primary/20 flex-shrink-0">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Model Performance
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm md:text-base">
              Historical on-chain performance for model ID: <span className="font-mono text-xs sm:text-sm">{modelId.substring(0, 8)}...</span>
            </p>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="relative overflow-hidden border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <CardContent className="relative p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-text-primary">{latestScore.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-text-secondary">Current Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <CardContent className="relative p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-text-primary">{averageScore.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-text-secondary">Average Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10" />
          <CardContent className="relative p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-text-primary">{trend > 0 ? '+' : ''}{trend.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-text-secondary">Score Trend</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Chart Card */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-surface/50 backdrop-blur-xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-purple-500/10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-purple-500" />

        <CardHeader className="relative pb-4 sm:pb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md sm:rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EMA Score Over Time
            </CardTitle>
          </div>
          <CardDescription className="text-sm sm:text-base md:text-lg text-text-secondary">
            Exponential Moving Average score reflects your model's recent performance on the network.
            Higher scores indicate better performance and potential for rewards.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pb-6 sm:pb-8">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <LoadingSpinner size={24} />
              </div>
              <p className="text-sm text-text-secondary">Loading performance data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-1 sm:mb-2">Could not load performance data</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto px-4 sm:px-0">
                This model may not have any data yet, or an error occurred while fetching the performance metrics.
              </p>
            </div>
          )}

          {data && chartData && chartData.length > 0 && (
            <div className="space-y-6">
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorEma" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorEmaStroke" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      }}
                      labelStyle={{
                        color: '#F9FAFB',
                        fontWeight: '600',
                      }}
                      itemStyle={{
                        color: '#3B82F6',
                        fontWeight: '500',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ema_score"
                      stroke="url(#colorEmaStroke)"
                      strokeWidth={3}
                      fill="url(#colorEma)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-text-secondary mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  <span>EMA Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{chartData.length} data points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Historical data</span>
                </div>
              </div>
            </div>
          )}

          {data && (!chartData || chartData.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Performance Data Available</h3>
              <p className="text-text-secondary max-w-md">
                This model hasn't participated in any predictions yet. Check back after the next epoch for performance data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 