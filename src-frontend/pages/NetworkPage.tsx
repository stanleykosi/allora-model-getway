import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Network,
  TrendingUp,
  Users,
  Activity,
  Eye,
  Sparkles,
  Target,
  Zap,
  Globe,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function NetworkPage() {
  console.log('🎯 NetworkPage component is rendering!');

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const api = useApi();

  // API functions
  const fetchActiveTopics = async (): Promise<any> => {
    console.log('📊 Fetching active topics...');
    try {
      const { data } = await api.get('/api/v1/predictions/topics');
      console.log('✅ Active topics fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch active topics:', error);
      throw error;
    }
  };

  const fetchTopicDetails = async (topicId: string): Promise<any> => {
    console.log('📊 Fetching topic details...');
    try {
      const { data } = await api.get(`/api/v1/predictions/topic/${topicId}`);
      console.log('✅ Topic details fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch topic details:', error);
      throw error;
    }
  };

  const fetchTopicInferences = async (topicId: string): Promise<any> => {
    console.log('📊 Fetching topic inferences...');
    try {
      const { data } = await api.get(`/api/v1/predictions/topic/${topicId}/inferences`);
      console.log('✅ Topic inferences fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch topic inferences:', error);
      throw error;
    }
  };

  const fetchTopicWorkers = async (topicId: string): Promise<any> => {
    console.log('📊 Fetching topic workers...');
    try {
      const { data } = await api.get(`/api/v1/predictions/topic/${topicId}/workers`);
      console.log('✅ Topic workers fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch topic workers:', error);
      throw error;
    }
  };

  const fetchTopicPredictions = async (topicId: string): Promise<any> => {
    console.log('📊 Fetching topic predictions...');
    try {
      const { data } = await api.get(`/api/v1/predictions/topic/${topicId}/predictions`);
      console.log('✅ Topic predictions fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch topic predictions:', error);
      throw error;
    }
  };

  // Queries
  const { data: topicsData, isLoading: isLoadingTopics, error: topicsError } = useQuery({
    queryKey: ['activeTopics'],
    queryFn: fetchActiveTopics,
  });

  const { data: topicDetails, isLoading: isLoadingTopicDetails } = useQuery({
    queryKey: ['topicDetails', selectedTopicId],
    queryFn: () => fetchTopicDetails(selectedTopicId!),
    enabled: !!selectedTopicId,
  });

  const { data: topicInferences, isLoading: isLoadingInferences } = useQuery({
    queryKey: ['topicInferences', selectedTopicId],
    queryFn: () => fetchTopicInferences(selectedTopicId!),
    enabled: !!selectedTopicId,
  });

  const { data: topicWorkers, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['topicWorkers', selectedTopicId],
    queryFn: () => fetchTopicWorkers(selectedTopicId!),
    enabled: !!selectedTopicId,
  });

  const { data: topicPredictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ['topicPredictions', selectedTopicId],
    queryFn: () => fetchTopicPredictions(selectedTopicId!),
    enabled: !!selectedTopicId,
  });

  if (isLoadingTopics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Network</h2>
          <p className="text-text-secondary">Fetching network activity...</p>
        </div>
      </div>
    );
  }

  if (topicsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load network data</h2>
          <p className="text-text-secondary mb-6">Please try again later.</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-primary to-accent">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const topics = topicsData?.topics || [];
  const totalWorkers = topicWorkers?.workers ?
    (Object.keys(topicWorkers.workers.inferers || {}).length +
      Object.keys(topicWorkers.workers.forecasters || {}).length +
      (topicWorkers.workers.reputers?.reputers?.length || 0)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Network Monitor
            </h1>
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Monitor network activity, track predictions, and view worker status across all topics.
          </p>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Active Topics</p>
                  <p className="text-3xl font-bold text-primary">{topics.length}</p>
                  <p className="text-xs text-text-secondary mt-1">Prediction topics</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Active Workers</p>
                  <p className="text-3xl font-bold text-green-500">{totalWorkers}</p>
                  <p className="text-xs text-text-secondary mt-1">Network participants</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Recent Inferences</p>
                  <p className="text-3xl font-bold text-accent">
                    {topicInferences?.inferences?.network_inferences?.inferer_values?.length || 0}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Latest predictions</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Network Status</p>
                  <p className="text-3xl font-bold text-purple-500">Active</p>
                  <p className="text-xs text-text-secondary mt-1">All systems operational</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Active Topics</CardTitle>
                    <CardDescription className="text-base">
                      Select a topic to view detailed network activity
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topics.map((topic: any) => (
                    <div
                      key={topic.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${selectedTopicId === topic.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-surface/50'
                        }`}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{topic.id}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-primary">{topic.metadata}</h4>
                          <p className="text-xs text-text-secondary">
                            {topic.epochLength || 0} blocks • {topic.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        {selectedTopicId === topic.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topic Details */}
          <div className="lg:col-span-2">
            {selectedTopicId ? (
              <div className="space-y-6">
                {/* Topic Overview */}
                <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
                        <Target className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Topic {selectedTopicId} Details</CardTitle>
                        <CardDescription className="text-base">
                          Network activity and performance metrics
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTopicDetails ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-text-secondary">Loading topic details...</p>
                      </div>
                    ) : topicDetails?.topic ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-text-primary mb-3">Basic Information</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-lg">
                              <span className="text-text-secondary">Topic ID:</span>
                              <span className="font-mono font-medium">{topicDetails.topic.id}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-lg">
                              <span className="text-text-secondary">Creator:</span>
                              <span className="font-mono text-xs">
                                {topicDetails.topic.creator?.substring(0, 8)}...{topicDetails.topic.creator?.substring(topicDetails.topic.creator.length - 8)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-lg">
                              <span className="text-text-secondary">Epoch Length:</span>
                              <span className="font-medium">{topicDetails.topic.epochLength} blocks</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-lg">
                              <span className="text-text-secondary">Status:</span>
                              <span className={`font-medium ${topicDetails.topic.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                {topicDetails.topic.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-text-primary mb-3">Metadata</h4>
                          <div className="p-4 bg-surface/50 rounded-lg">
                            <p className="text-sm text-text-secondary">
                              {topicDetails.topic.metadata || 'No metadata available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary">No topic details available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workers */}
                <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Active Workers</CardTitle>
                        <CardDescription className="text-base">
                          Network participants for this topic
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingWorkers ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-text-secondary">Loading workers...</p>
                      </div>
                    ) : topicWorkers?.workers ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-border">
                              <TableHead className="text-text-primary font-semibold">Worker Address</TableHead>
                              <TableHead className="text-text-primary font-semibold">Type</TableHead>
                              <TableHead className="text-text-primary font-semibold">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Display Inferers */}
                            {topicWorkers.workers.inferers && Object.keys(topicWorkers.workers.inferers).length > 0 ? (
                              Object.entries(topicWorkers.workers.inferers).map(([address, data]: [string, any], index: number) => (
                                <TableRow key={`inferer-${index}`} className="border-b border-border hover:bg-surface/50 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
                                        <Zap className="h-3 w-3 text-blue-500" />
                                      </div>
                                      <span className="font-mono text-sm">
                                        {address.substring(0, 8)}...{address.substring(address.length - 8)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-blue-500 font-medium">Inferer</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-green-500 font-medium">Active</span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : null}

                            {/* Display Forecasters */}
                            {topicWorkers.workers.forecasters && Object.keys(topicWorkers.workers.forecasters).length > 0 ? (
                              Object.entries(topicWorkers.workers.forecasters).map(([address, data]: [string, any], index: number) => (
                                <TableRow key={`forecaster-${index}`} className="border-b border-border hover:bg-surface/50 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                      </div>
                                      <span className="font-mono text-sm">
                                        {address.substring(0, 8)}...{address.substring(address.length - 8)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-green-500 font-medium">Forecaster</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-green-500 font-medium">Active</span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : null}

                            {/* Display Reputers */}
                            {topicWorkers.workers.reputers?.reputers && topicWorkers.workers.reputers.reputers.length > 0 ? (
                              topicWorkers.workers.reputers.reputers.map((address: string, index: number) => (
                                <TableRow key={`reputer-${index}`} className="border-b border-border hover:bg-surface/50 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center">
                                        <BarChart3 className="h-3 w-3 text-purple-500" />
                                      </div>
                                      <span className="font-mono text-sm">
                                        {address.substring(0, 8)}...{address.substring(address.length - 8)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-purple-500 font-medium">Reputer</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-green-500 font-medium">Active</span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : null}

                            {/* Show message if no workers */}
                            {(!topicWorkers.workers.inferers || Object.keys(topicWorkers.workers.inferers).length === 0) &&
                              (!topicWorkers.workers.forecasters || Object.keys(topicWorkers.workers.forecasters).length === 0) &&
                              (!topicWorkers.workers.reputers?.reputers || topicWorkers.workers.reputers.reputers.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-text-secondary py-8">
                                    <div className="text-center">
                                      <Users className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                                      <p>No active workers found for this topic</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary">No worker data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Inferences */}
                <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Recent Inferences</CardTitle>
                        <CardDescription className="text-base">
                          Latest network predictions and values
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInferences ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-text-secondary">Loading inferences...</p>
                      </div>
                    ) : topicInferences?.inferences?.network_inferences?.inferer_values && Array.isArray(topicInferences.inferences.network_inferences.inferer_values) ? (
                      <div className="space-y-4">
                        {topicInferences.inferences.network_inferences.inferer_values.slice(0, 5).map((inference: any, index: number) => (
                          <div key={index} className="p-4 border border-border rounded-xl bg-surface/50 hover:bg-surface/80 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                                  <Zap className="h-4 w-4 text-accent" />
                                </div>
                                <span className="font-medium text-text-primary">
                                  Inference #{index + 1}
                                </span>
                              </div>
                              <span className="text-sm text-text-secondary">
                                Block {topicInferences.inferences.inference_block_height}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-accent">
                                {inference.value || inference}
                              </div>
                              {inference.worker && (
                                <div className="text-sm text-text-secondary">
                                  Worker: {inference.worker.substring(0, 8)}...{inference.worker.substring(inference.worker.length - 8)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {topicInferences.inferences.network_inferences.combined_value && (
                          <div className="p-4 border border-accent/20 rounded-xl bg-accent/10">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-accent">Combined Network Value</span>
                              <span className="text-2xl font-bold text-accent">
                                {topicInferences.inferences.network_inferences.combined_value}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-8 w-8 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary">No inference data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Target className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-3">Select a Topic</h3>
                  <p className="text-text-secondary mb-6 max-w-md mx-auto">
                    Choose a topic from the list to view detailed network activity, workers, and recent inferences.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 