import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Wallet,
  Copy,
  Eye,
  EyeOff,
  Target,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  Shield,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/utils';
import { DevelopmentWarning } from '@/components/ui/DevelopmentWarning';
import AlloraIcon from '../components/icons/AlloraIcon';

export default function WalletManagementPage() {
  console.log('🎯 WalletManagementPage component is rendering!');

  const [showWalletPhrase, setShowWalletPhrase] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
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

  if (isLoadingModels || isLoadingWallets) {
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
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Wallet Management
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto px-4 sm:px-0">
            Manage your wallet credentials, view balances, and track your model performance.
          </p>
        </div>

        {/* Development Warning */}
        <DevelopmentWarning />

        {/* Top Row - Quick Actions */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md sm:rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Quick Actions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base">
                    Manage your wallets and models efficiently
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/models/register">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg hover:from-primary/20 hover:to-primary/10 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Register Model</p>
                        <p className="text-xs text-text-secondary">Create new model & wallet</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{models.length}</p>
                      <p className="text-xs text-text-secondary">Total Models</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{activeModels.length}</p>
                      <p className="text-xs text-text-secondary">Active Models</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{wallets.length}</p>
                      <p className="text-xs text-text-secondary">Total Wallets</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Information */}
        <Card className="border-0 shadow-2xl bg-surface/50 backdrop-blur-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-md sm:rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Wallet Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm md:text-base">
                  {wallets.length} wallet{wallets.length !== 1 && 's'} registered for your models
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {walletError ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2 sm:mb-3">No Wallet Registered</h3>
                <p className="text-sm text-text-secondary mb-4 sm:mb-6 max-w-md mx-auto px-4 sm:px-0">
                  You haven't registered any models yet. Register your first model to get a dedicated wallet with funding.
                </p>
                <Link to="/models/register">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
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