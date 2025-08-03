import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Eye,
  Copy,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Target,
  Zap,
  Network,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';
import AlloraIcon from '../components/icons/AlloraIcon';

export default function ManageModelsPage() {
  console.log('🎯 ManageModelsPage component is rendering!');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const updateModelStatus = async ({ modelId, action }: { modelId: string, action: 'activate' | 'deactivate' }): Promise<any> => {
    const { data } = await api.put(`/api/v1/models/${modelId}/${action}`);
    return data;
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

  const activateMutation = useMutation({
    mutationFn: ({ modelId }: { modelId: string }) => updateModelStatus({ modelId, action: 'activate' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userModels'] });
      toast.success('Model activated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to activate model:', error);
      toast.error('Failed to activate model');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ modelId }: { modelId: string }) => updateModelStatus({ modelId, action: 'deactivate' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userModels'] });
      toast.success('Model deactivated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to deactivate model:', error);
      toast.error('Failed to deactivate model');
    },
  });

  const handleStatusToggle = (model: any) => {
    if (model.is_active) {
      deactivateMutation.mutate({ modelId: model.id });
    } else {
      activateMutation.mutate({ modelId: model.id });
    }
  };

  const handleViewPerformance = (model: any) => {
    navigate(`/models/${model.id}`);
  };

  const handleCopyModelId = (modelId: string) => {
    copyToClipboard(modelId);
    toast.success('Model ID copied to clipboard');
  };

  // Filter and search models
  const filteredModels = React.useMemo(() => {
    let models = data?.models || [];

    // Apply status filter
    if (statusFilter !== 'all') {
      models = models.filter((model: any) => {
        if (statusFilter === 'active') return model.is_active;
        if (statusFilter === 'inactive') return !model.is_active;
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      models = models.filter((model: any) => {
        const modelType = `${model.is_inferer ? 'inferer' : ''}${model.is_inferer && model.is_forecaster ? ' ' : ''}${model.is_forecaster ? 'forecaster' : ''}`.trim();
        return model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.topic_id?.toString().includes(searchTerm) ||
          modelType.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return models;
  }, [data?.models, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Models</h2>
          <p className="text-text-secondary">Fetching your model data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load models</h2>
          <p className="text-text-secondary mb-6">Please try again later.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['userModels'] })} className="bg-gradient-to-r from-primary to-accent">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const models = data?.models || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Manage Models
            </h1>
          </div>
          <p className="text-sm sm:text-md md:text-lg text-text-secondary max-w-2xl mx-auto px-4 sm:px-0">
            View and manage all your registered models across the Allora Network.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 w-full">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm w-full bg-surface border-2 border-border rounded-lg sm:rounded-xl focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-xs sm:text-sm py-1.5 sm:py-2 h-auto px-2 sm:px-3"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-500/90 hover:to-green-600/90 text-xs sm:text-sm py-1.5 sm:py-2 h-auto px-2 sm:px-3"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-500/90 hover:to-purple-600/90 text-xs sm:text-sm py-1.5 sm:py-2 h-auto px-2 sm:px-3"
              >
                Inactive
              </Button>
            </div>
          </div>
          <Link to="/models/register" className="w-full md:w-auto">
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-10 sm:h-12 px-4 sm:px-6 w-full text-sm sm:text-base">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
              Register New Model
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Total Models</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{models.length}</p>
                  <p className="text-xs text-text-secondary mt-1">Registered models</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Active Models</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">
                    {models.filter((m: any) => m.is_active).length}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Currently running</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <ToggleRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Inactive Models</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-500">
                    {models.filter((m: any) => !m.is_active).length}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Paused models</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <ToggleLeft className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Topics</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
                    {new Set(models.map((m: any) => m.topic_id)).size}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Active topics</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Network className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Models Table */}
        <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md sm:rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Your Models</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  You have {filteredModels.length} model{filteredModels.length !== 1 && 's'}
                  {searchTerm && ` matching "${searchTerm}"`}
                  {statusFilter !== 'all' && ` (${statusFilter})`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredModels.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2 sm:mb-3">No models found</h3>
                <p className="text-sm text-text-secondary mb-4 sm:mb-6 max-w-md mx-auto px-4 sm:px-0">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No models match your filters. Try adjusting your search or filter criteria.'
                    : 'You haven\'t registered any models yet. Get started by registering your first model.'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Link to="/models/register">
                    <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                      Register Your First Model
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-text-primary font-semibold">Model</TableHead>
                      <TableHead className="text-text-primary font-semibold hidden md:table-cell">Topic</TableHead>
                      <TableHead className="text-text-primary font-semibold hidden lg:table-cell">Type</TableHead>
                      <TableHead className="text-text-primary font-semibold">Status</TableHead>
                      <TableHead className="text-right text-text-primary font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model: any) => (
                      <TableRow key={model.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-mono text-sm font-medium">
                                {model.id.substring(0, 8)}...
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyModelId(model.id)}
                                className="ml-2 h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-accent">{model.topic_id}</span>
                            </div>
                            <span className="font-medium text-text-primary">Topic {model.topic_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
                              <Zap className="h-3 w-3 text-green-500" />
                            </div>
                            <span className="capitalize font-medium text-text-primary">
                              {model.is_inferer ? 'Inferer' : ''}{model.is_inferer && model.is_forecaster ? ' + ' : ''}{model.is_forecaster ? 'Forecaster' : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${model.is_active ? 'bg-green-500' : 'bg-text-secondary/50'}`} />
                            <span className={`font-medium ${model.is_active ? 'text-green-500' : 'text-text-secondary'}`}>
                              {model.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPerformance(model)}
                              className="hover:bg-primary hover:text-white transition-all"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">View</span>
                            </Button>
                            <Button
                              variant={model.is_active ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleStatusToggle(model)}
                              disabled={activateMutation.isPending || deactivateMutation.isPending}
                              className={`${model.is_active
                                ? 'hover:bg-red-500 hover:text-white'
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-500/90 hover:to-green-600/90'
                                } transition-all`}
                            >
                              {activateMutation.isPending || deactivateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : model.is_active ? (
                                <>
                                  <ToggleLeft className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">Activate</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 