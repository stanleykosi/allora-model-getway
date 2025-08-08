import logger from '@/utils/logger';

export enum ChainErrorAction {
  Retry = 'Retry',
  SwitchNode = 'SwitchNode',
  ResetSequence = 'ResetSequence',
  Fail = 'Fail',
}

export interface ProcessedChainError {
  action: ChainErrorAction;
  expectedSequence?: number;
}

export function processChainError(error: any): ProcessedChainError {
  const errorMessage: string = (error?.message || String(error || '')).toLowerCase();
  logger.debug({ errorMessage }, 'Processing chain error');

  if (errorMessage.includes('account sequence mismatch')) {
    const match = errorMessage.match(/expected\s+(\d+)/);
    if (match && match[1]) {
      return {
        action: ChainErrorAction.ResetSequence,
        expectedSequence: parseInt(match[1], 10),
      };
    }
    return { action: ChainErrorAction.ResetSequence };
  }

  if (
    errorMessage.includes('connection refused') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('503 service unavailable')
  ) {
    return { action: ChainErrorAction.SwitchNode };
  }

  // Explicitly treat out-of-gas as retryable with adjusted gas on caller side
  if (errorMessage.includes('out of gas')) {
    return { action: ChainErrorAction.Retry };
  }

  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient fee')) {
    logger.error('Unrecoverable error: Insufficient funds or fee.');
    return { action: ChainErrorAction.Fail };
  }

  return { action: ChainErrorAction.Retry };
}


