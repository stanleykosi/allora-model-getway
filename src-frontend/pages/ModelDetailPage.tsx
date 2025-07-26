import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { PerformanceMetricsResponse } from '@/lib/types';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ModelDetailPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const api = useApi();

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

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
      <PageHeader
        title="Model Performance"
        description={`Historical on-chain performance for model ID: ${modelId.substring(0, 18)}...`}
      />
      <Card>
        <CardHeader>
          <CardTitle>EMA Score Over Time</CardTitle>
          <CardDescription>
            Exponential Moving Average score reflects your model's recent performance on the network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-error">
              <AlertTriangle size={40} className="mb-2" />
              <p className="font-semibold">Could not load performance data.</p>
              <p className="text-sm">This model may not have any data yet, or an error occurred.</p>
            </div>
          )}
          {data && chartData && chartData.length > 0 && (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorEma" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#38B2AC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="timestamp" stroke="#A0AEC0" />
                  <YAxis domain={['auto', 'auto']} stroke="#A0AEC0" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A202C',
                      borderColor: '#2D3748',
                    }}
                  />
                  <Area type="monotone" dataKey="ema_score" stroke="#38B2AC" fillOpacity={1} fill="url(#colorEma)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {data && (!chartData || chartData.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-text-secondary">
              <p>No performance data available for this model yet.</p>
              <p className="text-sm">Check back later after the next epoch.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
} 