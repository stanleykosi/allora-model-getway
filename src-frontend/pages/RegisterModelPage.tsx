import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ChevronDown,
  Globe,
  Zap,
  Settings,
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ModelRegistrationData, ModelRegistrationResponse, ActiveTopicsResponse } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const registerModelSchema = z.object({
  webhook_url: z.string().url({ message: "Must be a valid URL." }),
  topic_id: z.string().min(1, { message: "Topic ID is required." }),
  model_type: z.enum(['inference', 'forecaster']),
  max_gas_price: z.string().optional(),
});

export default function RegisterModelPage() {
  const navigate = useNavigate();
  const api = useApi();
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [isModelTypeDropdownOpen, setIsModelTypeDropdownOpen] = useState(false);

  const registerModel = async (data: ModelRegistrationData): Promise<ModelRegistrationResponse> => {
    const response = await api.post('/api/v1/models', data);
    return response.data;
  };

  const fetchActiveTopics = async (): Promise<ActiveTopicsResponse> => {
    const { data } = await api.get('/api/v1/predictions/topics');
    return data;
  };

  const { data: topicsData, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['activeTopics'],
    queryFn: fetchActiveTopics,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ModelRegistrationData>({
    resolver: zodResolver(registerModelSchema),
    mode: 'onChange',
  });

  const watchedValues = watch();

  const mutation = useMutation({
    mutationFn: registerModel,
    onSuccess: (data) => {
      toast.success('Model registered successfully!');
      console.log('Registration successful:', data);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Registration failed. Please try again.");
    },
  });

  const onSubmit = (data: ModelRegistrationData) => {
    mutation.mutate(data);
  };

  const selectedTopic = topicsData?.topics?.find(t => t.id === watchedValues.topic_id);
  const selectedModelType = watchedValues.model_type;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Register New Model
            </h1>
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Connect your machine learning model to the Allora Network and start earning rewards for your predictions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Model Configuration</CardTitle>
                    <CardDescription className="text-base">
                      Configure your model's parameters and network settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Topic Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Prediction Topic
                    </label>
                    <div className="relative">
                      <div
                        className="flex items-center justify-between w-full p-4 border-2 border-border rounded-xl bg-surface hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                      >
                        <div className="flex items-center gap-3">
                          {selectedTopic ? (
                            <>
                              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{selectedTopic.id}</span>
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">{selectedTopic.metadata}</p>
                                <p className="text-xs text-text-secondary">Topic ID: {selectedTopic.id}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 bg-surface border-2 border-border rounded-lg flex items-center justify-center">
                                <Globe className="h-4 w-4 text-text-secondary" />
                              </div>
                              <span className="text-text-secondary">Select a prediction topic</span>
                            </>
                          )}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${isTopicDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isTopicDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border-2 border-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                          {isLoadingTopics ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-text-secondary">Loading topics...</p>
                            </div>
                          ) : (
                            topicsData?.topics.map((topic) => (
                              <div
                                key={topic.id}
                                className="flex items-center gap-3 p-4 hover:bg-surface/80 cursor-pointer border-b border-border last:border-b-0"
                                onClick={() => {
                                  setValue('topic_id', topic.id);
                                  setIsTopicDropdownOpen(false);
                                }}
                              >
                                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                  <span className="text-sm font-bold text-primary">{topic.id}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-text-primary">{topic.metadata}</p>
                                  <p className="text-xs text-text-secondary">Active prediction topic</p>
                                </div>
                                {watchedValues.topic_id === topic.id && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {errors.topic_id && (
                      <div className="flex items-center gap-2 text-sm text-error">
                        <AlertCircle className="h-4 w-4" />
                        {errors.topic_id.message}
                      </div>
                    )}
                  </div>

                  {/* Model Type Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Model Type
                    </label>
                    <div className="relative">
                      <div
                        className="flex items-center justify-between w-full p-4 border-2 border-border rounded-xl bg-surface hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setIsModelTypeDropdownOpen(!isModelTypeDropdownOpen)}
                      >
                        <div className="flex items-center gap-3">
                          {selectedModelType ? (
                            <>
                              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                                <Zap className="h-4 w-4 text-accent" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary capitalize">{selectedModelType}</p>
                                <p className="text-xs text-text-secondary">
                                  {selectedModelType === 'inference' ? 'Real-time predictions' : 'Future predictions'}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 bg-surface border-2 border-border rounded-lg flex items-center justify-center">
                                <Zap className="h-4 w-4 text-text-secondary" />
                              </div>
                              <span className="text-text-secondary">Select model type</span>
                            </>
                          )}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${isModelTypeDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isModelTypeDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border-2 border-border rounded-xl shadow-2xl z-50">
                          {[
                            { value: 'inference', label: 'Inference', description: 'Real-time predictions' },
                            { value: 'forecaster', label: 'Forecaster', description: 'Future predictions' }
                          ].map((type) => (
                            <div
                              key={type.value}
                              className="flex items-center gap-3 p-4 hover:bg-surface/80 cursor-pointer border-b border-border last:border-b-0"
                              onClick={() => {
                                setValue('model_type', type.value as 'inference' | 'forecaster');
                                setIsModelTypeDropdownOpen(false);
                              }}
                            >
                              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                                <Zap className="h-4 w-4 text-accent" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-text-primary">{type.label}</p>
                                <p className="text-xs text-text-secondary">{type.description}</p>
                              </div>
                              {selectedModelType === type.value && (
                                <CheckCircle className="h-4 w-4 text-accent" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.model_type && (
                      <div className="flex items-center gap-2 text-sm text-error">
                        <AlertCircle className="h-4 w-4" />
                        {errors.model_type.message}
                      </div>
                    )}
                  </div>

                  {/* Webhook URL */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Webhook URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://your-model.com/webhook"
                      className="h-12 text-base border-2 border-border rounded-xl bg-surface hover:border-primary/50 focus:border-primary transition-all"
                      {...register('webhook_url')}
                    />
                    {errors.webhook_url && (
                      <div className="flex items-center gap-2 text-sm text-error">
                        <AlertCircle className="h-4 w-4" />
                        {errors.webhook_url.message}
                      </div>
                    )}
                  </div>

                  {/* Max Gas Price */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Max Gas Price (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="5000000000"
                      className="h-12 text-base border-2 border-border rounded-xl bg-surface hover:border-primary/50 focus:border-primary transition-all"
                      {...register('max_gas_price')}
                    />
                    <p className="text-xs text-text-secondary">
                      Maximum gas price in wei. Leave empty for default settings.
                    </p>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={mutation.isPending || !isValid}
                      className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Registering Model...
                        </>
                      ) : (
                        <>
                          Register Model
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="h-12 px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Model Preview */}
            <Card className="border-0 shadow-xl bg-surface/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Model Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTopic && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary">Selected Topic</p>
                    <p className="text-xs text-text-secondary">{selectedTopic.metadata}</p>
                  </div>
                )}
                {selectedModelType && (
                  <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm font-medium text-accent">Model Type</p>
                    <p className="text-xs text-text-secondary capitalize">{selectedModelType}</p>
                  </div>
                )}
                {watchedValues.webhook_url && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm font-medium text-green-500">Webhook URL</p>
                    <p className="text-xs text-text-secondary truncate">{watchedValues.webhook_url}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  What You'll Get
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-sm text-text-primary">Dedicated wallet with funding</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-sm text-text-primary">Earn rewards for predictions</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-sm text-text-primary">Real-time network integration</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 