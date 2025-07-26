// These types are derived from the HTTP server codebase and project specification

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistrationResponse {
  success: boolean;
  user_id: string;
  email: string;
  api_key: string;
  message: string;
}

export interface ModelRegistrationData {
  webhook_url: string;
  topic_id: string;
  model_type: 'inference' | 'forecaster';
  max_gas_price?: string;
}

export interface ModelRegistrationResponse {
  modelId: string;
  walletAddress: string;
  costsIncurred: {
    registrationFee: string;
    initialFunding: string;
    total: string;
  };
}

export interface UserWallet {
  model_id: string;
  model_type: string;
  topic_id: string;
  wallet_id: string;
  wallet_address: string;
  mnemonic_phrase: string;
  created_at: string;
}

export interface UserWalletsResponse {
  user_id: string;
  wallets: UserWallet[];
  message: string;
}

export interface PerformanceMetric {
  timestamp: string;
  ema_score: string;
}

export interface PerformanceMetricsResponse {
  performance_metrics: PerformanceMetric[];
}

export interface AlloraTopic {
  id: string;
  epochLength: number;
  isActive: boolean;
  creator: string;
  metadata: string;
}

export interface ActiveTopicsResponse {
  topics: AlloraTopic[];
  count: number;
  timestamp: string;
}

export interface ModelUpdateResponse {
  message: string;
  model: {
    id: string;
    topic_id: string;
    model_type: string;
    is_active: boolean;
    updated_at: string;
  };
} 