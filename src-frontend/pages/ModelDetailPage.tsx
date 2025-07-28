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
    navigate('/404');
    return null;
  }

  const fetchPerformanceHistory = async (modelId: string): Promise<PerformanceMetricsResponse> => {
    const { data } = await api.get(`/api/v1/models/${modelId}/performance`);
    return data;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['performanceHistory', modelId],
    queryFn: () => fetchPerformanceHistory(modelId),
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
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="group bg-surface/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-surface/80 transition-all duration-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>
      </div>

      {/* Enhanced Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Model Performance
            </h1>
            <p className="text-text-secondary">
              Historical on-chain performance for model ID: {modelId.substring(0, 18)}...
            </p>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{latestScore.toFixed(2)}</div>
                <div className="text-sm text-text-secondary">Current Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{averageScore.toFixed(2)}</div>
                <div className="text-sm text-text-secondary">Average Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{trend > 0 ? '+' : ''}{trend.toFixed(2)}</div>
                <div className="text-sm text-text-secondary">Score Trend</div>
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

        <CardHeader className="relative pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EMA Score Over Time
            </CardTitle>
          </div>
          <CardDescription className="text-lg text-text-secondary">
            Exponential Moving Average score reflects your model's recent performance on the network.
            Higher scores indicate better performance and potential for rewards.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pb-8">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4">
                <LoadingSpinner size={32} />
              </div>
              <p className="text-text-secondary">Loading performance data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Could not load performance data</h3>
              <p className="text-text-secondary max-w-md">
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
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
              <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
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