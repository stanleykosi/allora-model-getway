import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ModelRegistrationData, ModelRegistrationResponse, ActiveTopicsResponse } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
import PageHeader from '@/components/shared/PageHeader';
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
    formState: { errors },
  } = useForm<ModelRegistrationData>({
    resolver: zodResolver(registerModelSchema),
  });

  const mutation = useMutation({
    mutationFn: registerModel,
    onSuccess: (data) => {
      toast.success('Model registered successfully!');
      console.log('Registration successful:', data);
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Registration failed. Please try again.");
    },
  });

  const onSubmit = (data: ModelRegistrationData) => {
    mutation.mutate(data);
  };

  return (
    <>
      <PageHeader
        title="Register New Model"
        description="Provide your model's details to get it connected to the Allora Network."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Model Details</CardTitle>
          <CardDescription>
            The server will create and fund a dedicated wallet for this model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="topic_id" className="text-sm font-medium">Topic ID</label>
              <select
                id="topic_id"
                {...register('topic_id')}
                className="flex h-10 w-full rounded-md border border-surface bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoadingTopics}
              >
                {isLoadingTopics ? (
                  <option>Loading topics...</option>
                ) : (
                  topicsData?.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.id} - {topic.metadata}
                    </option>
                  ))
                )}
              </select>
              {errors.topic_id && <p className="text-sm text-error">{errors.topic_id.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="webhook_url" className="text-sm font-medium">Webhook URL</label>
              <Input
                id="webhook_url"
                type="url"
                placeholder="https://your-model.com/webhook"
                {...register('webhook_url')}
              />
              {errors.webhook_url && <p className="text-sm text-error">{errors.webhook_url.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="model_type" className="text-sm font-medium">Model Type</label>
              <select
                id="model_type"
                {...register('model_type')}
                className="flex h-10 w-full rounded-md border border-surface bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select model type</option>
                <option value="inference">Inference</option>
                <option value="forecaster">Forecaster</option>
              </select>
              {errors.model_type && <p className="text-sm text-error">{errors.model_type.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="max_gas_price" className="text-sm font-medium">Max Gas Price (Optional)</label>
              <Input
                id="max_gas_price"
                type="text"
                placeholder="5000000000"
                {...register('max_gas_price')}
              />
              {errors.max_gas_price && <p className="text-sm text-error">{errors.max_gas_price.message}</p>}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Registering...
                  </>
                ) : (
                  'Register Model'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
} 