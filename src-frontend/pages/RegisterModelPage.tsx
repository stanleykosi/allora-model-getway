import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  Info,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Target,
  Activity,
  Gauge,
  PlusCircle
} from 'lucide-react';
import { ModelRegistrationData, ModelRegistrationResponse, ActiveTopicsResponse } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AlloraIcon from '../components/icons/AlloraIcon';

// New Zod schema
const registerModelSchema = z.object({
  webhook_url: z.string().url({ message: "Must be a valid URL." }),
  topic_id: z.string().min(1, { message: "Topic ID is required." }),
  is_inferer: z.boolean().default(true),
  is_forecaster: z.boolean().default(false),
  max_gas_price: z.string().optional(),
}).refine(data => data.is_inferer || data.is_forecaster, {
  message: "Model must be at least an inferer or a forecaster.",
  path: ["is_inferer"], // Assign error to one of the fields
});

export default function RegisterModelPage() {
  const navigate = useNavigate();
  const api = useApi();
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [isModelTypeDropdownOpen, setIsModelTypeDropdownOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [webhookValidation, setWebhookValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [copied, setCopied] = useState(false);

  const registerModel = async (data: ModelRegistrationData): Promise<ModelRegistrationResponse> => {
    const response = await api.post('/api/v1/models', data);
    return response.data;
  };

  const fetchActiveTopics = async (): Promise<ActiveTopicsResponse> => {
    const { data } = await api.get('/api/v1/predictions/topics');
    return data;
  };

  const { data: topicsData, isLoading: isLoadingTopics, error: topicsError } = useQuery({
    queryKey: ['activeTopics'],
    queryFn: fetchActiveTopics,
    onSuccess: (data) => {
      console.log('✅ Topics fetched successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Failed to fetch topics:', error);
    },
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
    onSuccess: (data: ModelRegistrationResponse) => {
      const tx = data?.registrationTxHash;
      if (tx) {
        const url = `https://testnet.allora.explorers.guru/transaction/${tx}`;
        toast(() => (
          <div className="text-sm">
            <div className="font-semibold mb-1">Model registered successfully</div>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              View transaction
            </a>
          </div>
        ));
      } else {
        toast.success('Model registered successfully!');
      }
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

  // Auto-advance steps based on form completion
  useEffect(() => {
    if (watchedValues.topic_id && currentStep === 1) {
      setTimeout(() => setCurrentStep(2), 300);
    }
    if ((watchedValues.is_inferer || watchedValues.is_forecaster) && currentStep === 2) {
      setTimeout(() => setCurrentStep(3), 300);
    }
  }, [watchedValues.topic_id, watchedValues.is_inferer, watchedValues.is_forecaster, currentStep]);

  // Webhook URL validation
  useEffect(() => {
    if (watchedValues.webhook_url && watchedValues.webhook_url.length > 10) {
      setWebhookValidation('validating');
      const timer = setTimeout(() => {
        const isValid = /^https?:\/\/.+/.test(watchedValues.webhook_url);
        setWebhookValidation(isValid ? 'valid' : 'invalid');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setWebhookValidation('idle');
    }
  }, [watchedValues.webhook_url]);

  const handleCopyExample = () => {
    navigator.clipboard.writeText('https://your-model-endpoint.com/webhook');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'upcoming';
  };

  const steps = [
    { number: 1, title: 'Select Topic', description: 'Choose prediction category', icon: Target },
    { number: 2, title: 'Model Capabilities', description: 'Define model behavior', icon: Activity },
    { number: 3, title: 'Configuration', description: 'Setup connection', icon: Settings },
    { number: 4, title: 'Review', description: 'Confirm & deploy', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-surface/10">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface/50 via-surface/30 to-surface/50 backdrop-blur-xl border-b border-border/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500/20 via-green-500/10 to-emerald-500/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 md:mb-6 shadow-2xl shadow-green-500/10">
              <PlusCircle className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-text-primary via-primary to-accent bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4">
              Model Registration
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-4">
              Deploy your machine learning model to the Allora Network with enterprise-grade security and monitoring
            </p>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center mt-6 sm:mt-8 mb-3 sm:mb-4 overflow-x-auto pb-3 sm:pb-4">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.number);
                  const Icon = step.icon;

                  return (
                    <div key={step.number} className="flex items-center">
                      <div className="flex flex-col items-center text-center w-16 sm:w-24 md:w-32">
                        <div className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 ${status === 'completed'
                          ? 'bg-primary text-white shadow-lg shadow-primary/25'
                          : status === 'active'
                            ? 'bg-primary/20 text-primary border-2 border-primary/50 shadow-lg shadow-primary/10'
                            : 'bg-surface/50 text-text-secondary border border-border/50'
                          }`}>
                          {status === 'completed' ? (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          ) : (
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          )}
                          {status === 'active' && (
                            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-primary/20 animate-pulse" />
                          )}
                        </div>
                        <div className="mt-1 sm:mt-2">
                          <p className={`text-[10px] sm:text-xs md:text-sm font-medium truncate ${status === 'active' ? 'text-primary' : 'text-text-secondary'}`}>
                            {step.title}
                          </p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-4 sm:w-8 md:w-16 h-0.5 mx-1 sm:mx-2 md:mx-4 transition-colors duration-300 ${status === 'completed' ? 'bg-primary' : 'bg-border/30'
                          }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          {/* Main Registration Form */}
          <div className="xl:col-span-3">
            <Card className="border-0 shadow-2xl bg-surface/60 backdrop-blur-xl ring-1 ring-border/20 hover:ring-border/40 transition-all duration-300">
              <CardHeader className="pb-6 sm:pb-8 border-b border-border/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500/20 via-green-500/10 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/10 flex-shrink-0">
                      <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary">Model Configuration</CardTitle>
                      <CardDescription className="text-xs sm:text-sm md:text-base text-text-secondary mt-0.5 sm:mt-1">
                        Configure your model parameters with precision and security
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full self-start sm:self-center">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm font-medium text-primary">Live Configuration</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-4 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 sm:space-y-10">
                  {/* Step 1: Topic Selection */}
                  <div className={`transition-all duration-500 ${currentStep >= 1 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-md sm:rounded-lg flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold text-primary">1</span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-text-primary">Prediction Topic</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
                    </div>

                    <div className="relative">
                      <div
                        className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-4 sm:p-6 rounded-2xl transition-all duration-300 cursor-pointer ${selectedTopic
                          ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/30 shadow-lg shadow-primary/5'
                          : 'bg-surface/80 border-2 border-border/30 hover:border-primary/40 hover:bg-surface/90'
                          }`}
                        onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                      >
                        <div className="flex items-center gap-4">
                          {selectedTopic ? (
                            <>
                              <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                <span className="text-lg font-bold text-primary">{selectedTopic.id}</span>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-text-primary">{selectedTopic.metadata}</p>
                                <p className="text-sm text-text-secondary">Topic ID: {selectedTopic.id} • Active Network</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <span className="text-xs text-green-500 font-medium">Live Predictions</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-surface/80 border-2 border-border/50 rounded-xl flex items-center justify-center group-hover:border-primary/40 transition-colors flex-shrink-0">
                                <Target className="h-6 w-6 text-text-secondary group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <span className="text-lg font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                  Select prediction topic
                                </span>
                                <p className="text-sm text-text-secondary">Choose from active network topics</p>
                              </div>
                            </>
                          )}
                        </div>
                        <ChevronDown className={`h-6 w-6 text-text-secondary transition-all duration-300 self-center mt-4 sm:mt-0 ${isTopicDropdownOpen ? 'rotate-180 text-primary' : 'group-hover:text-primary'
                          }`} />
                      </div>

                      {isTopicDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-surface/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl z-50 max-h-60 sm:max-h-80 overflow-y-auto">
                          {isLoadingTopics ? (
                            <div className="p-8 text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                              <p className="text-text-secondary">Loading active topics...</p>
                            </div>
                          ) : (
                            <div className="p-2">
                              {topicsData?.topics.map((topic, index) => (
                                <div
                                  key={topic.id}
                                  className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 ${index !== topicsData.topics.length - 1 ? 'border-b border-border/20' : ''
                                    } hover:bg-primary/5 group`}
                                  onClick={() => {
                                    setValue('topic_id', topic.id);
                                    setIsTopicDropdownOpen(false);
                                  }}
                                >
                                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/15 transition-all flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">{topic.id}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">{topic.metadata}</p>
                                    <p className="text-sm text-text-secondary">Active prediction market</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                      <span className="text-xs text-green-500 font-medium">LIVE</span>
                                    </div>
                                    {watchedValues.topic_id === topic.id && (
                                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.topic_id && (
                      <div className="flex items-center gap-3 mt-4 p-4 bg-error/10 border border-error/20 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                        <span className="text-error font-medium">{errors.topic_id.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Model Capabilities */}
                  <div className={`transition-all duration-500 ${currentStep >= 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent/30 to-accent/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-accent">2</span>
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary">Model Capabilities</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 rounded-2xl border-2 border-border/30 bg-surface/80">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl flex items-center justify-center">
                            <Zap className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                {...register('is_inferer')}
                                className="w-5 h-5 text-primary bg-surface border-2 border-border rounded focus:ring-primary focus:ring-2"
                              />
                              <h4 className="text-lg font-semibold text-text-primary">Inference Model</h4>
                            </div>
                            <p className="text-sm text-text-secondary mt-1 ml-8">Generate real-time predictions with immediate results</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl border-2 border-border/30 bg-surface/80">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                {...register('is_forecaster')}
                                className="w-5 h-5 text-primary bg-surface border-2 border-border rounded focus:ring-primary focus:ring-2"
                              />
                              <h4 className="text-lg font-semibold text-text-primary">Forecaster Model</h4>
                            </div>
                            <p className="text-sm text-text-secondary mt-1 ml-8">Generate forecasts for other workers' performance</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {errors.is_inferer && (
                      <div className="flex items-center gap-3 mt-4 p-4 bg-error/10 border border-error/20 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                        <span className="text-error font-medium">{errors.is_inferer.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Configuration */}
                  <div className={`transition-all duration-500 ${currentStep >= 3 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-green-500">3</span>
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary">Webhook Configuration</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-4">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-text-primary mb-3">
                          Webhook URL <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            type="url"
                            placeholder="https://your-model-endpoint.com/webhook"
                            className={`h-14 text-base pl-12 pr-12 rounded-xl border-2 transition-all duration-300 ${webhookValidation === 'valid'
                              ? 'border-green-500/50 bg-green-500/5 focus:border-green-500'
                              : webhookValidation === 'invalid'
                                ? 'border-error/50 bg-error/5 focus:border-error'
                                : 'border-border hover:border-primary/50 focus:border-primary bg-surface'
                              }`}
                            {...register('webhook_url')}
                          />
                          <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            {webhookValidation === 'validating' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                            {webhookValidation === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {webhookValidation === 'invalid' && <AlertTriangle className="h-5 w-5 text-error" />}
                          </div>
                        </div>

                        {/* Example */}
                        <div className="mt-3 p-4 bg-surface/50 rounded-xl border border-border/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-text-primary">Example URL:</p>
                              <code className="text-sm text-text-secondary">https://your-model-endpoint.com/webhook</code>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopyExample}
                              className="h-8 px-3"
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      {errors.webhook_url && (
                        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl">
                          <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                          <span className="text-error font-medium">{errors.webhook_url.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Advanced Settings */}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm font-medium">Advanced Settings</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                      </button>

                      {showAdvanced && (
                        <div className="mt-4 p-6 bg-surface/30 rounded-xl border border-border/30">
                          <div className="space-y-4">
                            <label className="block text-sm font-semibold text-text-primary">
                              Max Gas Price (Optional)
                            </label>
                            <Input
                              type="text"
                              placeholder="5000000000"
                              className="h-12 rounded-xl border-2 border-border hover:border-primary/50 focus:border-primary bg-surface"
                              {...register('max_gas_price')}
                            />
                            <p className="text-xs text-text-secondary flex items-center gap-2">
                              <Info className="h-3 w-3" />
                              Maximum gas price in wei. Leave empty for automatic optimization.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className="pt-8 border-t border-border/20">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        type="submit"
                        disabled={mutation.isPending || !isValid}
                        className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 w-full"
                      >
                        {mutation.isPending ? (
                          <div className="flex items-center justify-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Registering Model...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <span>Deploy Model</span>
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="h-14 px-8 text-base border-2 w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Preview */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-surface/60 to-surface/40 backdrop-blur-xl ring-1 ring-border/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <span>Live Preview</span>
                </CardTitle>
                <CardDescription>Real-time configuration overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTopic ? (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Prediction Topic</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary">{selectedTopic.metadata}</p>
                    <p className="text-xs text-text-secondary">ID: {selectedTopic.id}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-surface/50 rounded-xl border border-border/30 border-dashed">
                    <p className="text-sm text-text-secondary">No topic selected</p>
                  </div>
                )}

                {(() => {
                  const capabilityLabel = (watchedValues.is_inferer && watchedValues.is_forecaster)
                    ? 'Inference + Forecast'
                    : watchedValues.is_inferer
                      ? 'Inference'
                      : watchedValues.is_forecaster
                        ? 'Forecast'
                        : null;

                  return capabilityLabel ? (
                    <div className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-accent" />
                        <span className="text-sm font-semibold text-accent">Model Capabilities</span>
                      </div>
                      <p className="text-sm font-medium text-text-primary">{capabilityLabel}</p>
                      <p className="text-xs text-text-secondary">
                        {(capabilityLabel.includes('Inference') ? 'Real-time predictions' : '')}
                        {(capabilityLabel.includes('Inference') && capabilityLabel.includes('Forecast') ? ' • ' : '')}
                        {(capabilityLabel.includes('Forecast') ? 'Forecasts for other workers' : '')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface/50 rounded-xl border border-border/30 border-dashed">
                      <p className="text-sm text-text-secondary">No capabilities selected</p>
                    </div>
                  );
                })()}

                {watchedValues.webhook_url ? (
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-500">Webhook Endpoint</span>
                    </div>
                    <p className="text-xs text-text-secondary font-mono break-all">{watchedValues.webhook_url}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-surface/50 rounded-xl border border-border/30 border-dashed">
                    <p className="text-sm text-text-secondary">No webhook configured</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-accent/5 to-surface/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-500" />
                  </div>
                  <span>Enterprise Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Wallet, text: 'Dedicated funded wallet', color: 'text-blue-500' },
                  { icon: DollarSign, text: 'Automated reward distribution', color: 'text-green-500' },
                  { icon: Shield, text: 'Enterprise-grade security', color: 'text-purple-500' },
                  { icon: Gauge, text: 'Real-time performance monitoring', color: 'text-orange-500' },
                  { icon: Clock, text: '24/7 network integration', color: 'text-cyan-500' }
                ].map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface/20 transition-colors">
                      <div className="w-8 h-8 bg-surface/50 rounded-lg flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${benefit.color}`} />
                      </div>
                      <p className="text-sm font-medium text-text-primary">{benefit.text}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Security Badge */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-500/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">Enterprise Security</h3>
                <p className="text-sm text-text-secondary">
                  SOC 2 compliant infrastructure with end-to-end encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 