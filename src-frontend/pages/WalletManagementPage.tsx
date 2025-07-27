import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Wallet,
  User,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  Zap,
  Network,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Plus,
  Shield,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/utils';

export default function WalletManagementPage() {
  console.log('🎯 WalletManagementPage component is rendering!');

  const [showWalletPhrase, setShowWalletPhrase] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const api = useApi();

  // API functions
  const fetchUserProfile = async (): Promise<any> => {
    console.log('📊 Fetching user profile...');
    try {
      const { data } = await api.get('/api/v1/users/profile');
      console.log('✅ User profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  };

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

  const fetchUserWalletPhrases = async (): Promise<any> => {
    console.log('📊 Fetching user wallet phrases...');
    try {
      const { data } = await api.get('/api/v1/users/wallet-phrases');
      console.log('✅ User wallet phrases fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch user wallet phrases:', error);
      throw error;
    }
  };

  // Queries
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  });

  const { data: userModels, isLoading: isLoadingModels } = useQuery({
    queryKey: ['userModels'],
    queryFn: fetchUserModels,
  });

  const { data: walletData, isLoading: isLoadingWallets, error: walletError } = useQuery({
    queryKey: ['userWalletPhrases'],
    queryFn: fetchUserWalletPhrases,
  });

  const handleCopyWalletPhrase = (phrase: string) => {
    copyToClipboard(phrase);
    toast.success('Wallet phrase copied to clipboard');
  };

  const handleCopyWalletAddress = (address: string) => {
    copyToClipboard(address);
    toast.success('Wallet address copied to clipboard');
  };

  const toggleWalletPhraseVisibility = (walletId: string) => {
    setShowWalletPhrase(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  if (isLoadingProfile || isLoadingModels || isLoadingWallets) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Wallet</h2>
          <p className="text-text-secondary">Fetching your wallet information...</p>
        </div>
      </div>
    );
  }

  const models = userModels?.models || [];
  const activeModels = models.filter((model: any) => model.is_active);
  const wallets = walletData?.wallets || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Wallet Management
            </h1>
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Manage your wallet credentials, view balances, and track your model performance.
          </p>
        </div>

        {/* Top Row - User Profile & Account Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Profile */}
          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">User Profile</CardTitle>
                  <CardDescription className="text-base">
                    Your account information and details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-text-secondary">{user?.emailAddresses?.[0]?.emailAddress}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    User ID: {user?.id}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-3 bg-surface/50 rounded-lg">
                  <p className="text-xs text-text-secondary">Created</p>
                  <p className="font-medium text-text-primary">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-surface/50 rounded-lg">
                  <p className="text-xs text-text-secondary">Last Sign In</p>
                  <p className="font-medium text-text-primary">
                    {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Overview */}
          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Account Overview</CardTitle>
                  <CardDescription className="text-base">
                    Your model and wallet statistics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Registered Models</p>
                      <p className="text-2xl font-bold text-primary">{models.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Active Models</p>
                      <p className="text-2xl font-bold text-green-500">{activeModels.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Wallets</p>
                      <p className="text-2xl font-bold text-accent">{wallets.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Network className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Topics</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {new Set(models.map((m: any) => m.topic_id)).size}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Information */}
        <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Wallet Information</CardTitle>
                <CardDescription className="text-base">
                  {wallets.length} wallet{wallets.length !== 1 && 's'} registered for your models
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {walletError ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wallet className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">No Wallet Registered</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  You haven't registered any models yet. Register your first model to get a dedicated wallet with funding.
                </p>
                <Link to="/models/register">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-12 px-8">
                    <Plus className="h-5 w-5 mr-2" />
                    Register Your First Model
                  </Button>
                </Link>
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wallet className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">No Wallet Registered</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  You haven't registered any models yet. Register your first model to get a dedicated wallet with funding.
                </p>
                <Link to="/models/register">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-12 px-8">
                    <Plus className="h-5 w-5 mr-2" />
                    Register Your First Model
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wallets.map((wallet: any, index: number) => (
                  <Card key={index} className="border-0 shadow-xl bg-surface/30 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Wallet {index + 1}</CardTitle>
                          <CardDescription className="text-sm">
                            Topic {wallet.topic_id || 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Wallet Address */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Wallet Address
                        </label>
                        <div className="flex items-start gap-2 p-3 bg-surface/50 rounded-lg border border-border">
                          <span className="font-mono text-xs break-all flex-1">
                            {wallet.wallet_address}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyWalletAddress(wallet.wallet_address)}
                            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Wallet Phrase */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Wallet Phrase
                        </label>
                        <div className="flex items-start gap-2 p-3 bg-surface/50 rounded-lg border border-border">
                          <span className="font-mono text-xs break-all flex-1">
                            {showWalletPhrase[index] ? wallet.mnemonic_phrase : '••••••••••••••••••••••••••••••••••••••••'}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWalletPhraseVisibility(index.toString())}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              {showWalletPhrase[index] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyWalletPhrase(wallet.mnemonic_phrase)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Balance Info */}
                      <div className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-secondary">Balance</span>
                          <span className="text-sm font-medium text-accent">Funded by Network</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 