import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';

export default function DashboardPage() {
  console.log('🎯 DashboardPage component is rendering!');

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const mutation = useMutation({
    mutationFn: updateModelStatus,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['userModels'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update model status.");
    },
  });

  const handleToggleActive = (modelId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    mutation.mutate({ modelId, action });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading your models...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-error">Error loading models. Please try again.</div>
      </div>
    );
  }

  const models = data?.models || [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="mt-2 text-text-secondary">
          Manage your registered models and monitor their performance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Models</CardTitle>
          <CardDescription>
            You have {models.length} model{models.length !== 1 && 's'} registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model ID</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length > 0 ? (
                models.map((model: any) => {
                  return (
                    <TableRow key={model.id}>
                      <TableCell className="font-mono text-xs">{model.id.substring(0, 18)}...</TableCell>
                      <TableCell>{model.topic_id}</TableCell>
                      <TableCell className="capitalize">{model.model_type}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(model.id, model.is_active)}
                          disabled={mutation.isPending && mutation.variables?.modelId === model.id}
                        >
                          {model.is_active ?
                            <ToggleRight className="mr-2 h-5 w-5 text-accent" /> :
                            <ToggleLeft className="mr-2 h-5 w-5 text-text-secondary" />
                          }
                          {model.is_active ? 'Active' : 'Inactive'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/models/${model.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" /> View Performance
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-text-secondary">
                      <p className="text-lg font-semibold mb-2">No models registered yet</p>
                      <p className="mb-4">Get started by registering your first model.</p>
                      <Link to="/models/register">
                        <Button>
                          Register Model
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Your Secure Wallet Phrases">
        <div className="space-y-4">
          <div className="rounded-md bg-error/10 p-4 text-sm text-error">
            <p className="font-bold">WARNING: Never share these phrases with anyone.</p>
            <p>They control your model's funds. Store them securely in a password manager.</p>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
            {models.length > 0 ? (
              models.map((model) => (
                <div key={model.id} className="rounded-md border border-surface p-3">
                  <p className="text-sm font-semibold text-text-primary">Model ID: <span className="font-mono text-xs">{model.id}</span></p>
                  <p className="text-sm text-text-secondary">Topic: {model.topic_id}</p>
                  <p className="text-sm text-text-secondary">Type: {model.model_type}</p>
                  <p className="text-sm text-text-secondary">Status: {model.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-text-secondary">No models registered yet.</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
} 