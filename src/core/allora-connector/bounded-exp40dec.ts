import BigNumber from 'bignumber.js';
import { config } from '@/config';

/**
 * Fixed precision for BoundedExp40Dec.
 * Assumed 18 decimals unless confirmed otherwise by the Allora team.
 */
export const B_EXP_40_DEC_PRECISION = config.BOUNDED_EXP40DEC_PRECISION;

/**
 * Converts a numeric input into the integer string expected for math.BoundedExp40Dec.
 * Throws if input is null/undefined or not numeric.
 */
export function formatToBoundedExp40Dec(value: string | number): string {
  if (value === null || value === undefined) {
    if (config.INVALID_MODEL_OUTPUT_POLICY === 'zero') return '0';
    if (config.INVALID_MODEL_OUTPUT_POLICY === 'skip') throw new Error('SKIP_SUBMISSION');
    throw new Error('Input value cannot be null or undefined for BoundedExp40Dec conversion.');
  }

  const bn = new BigNumber(value);
  if (!bn.isFinite()) {
    if (config.INVALID_MODEL_OUTPUT_POLICY === 'zero') return '0';
    if (config.INVALID_MODEL_OUTPUT_POLICY === 'skip') throw new Error('SKIP_SUBMISSION');
    throw new Error(`Failed to convert value "${value}" to BoundedExp40Dec format.`);
  }

  // Bounds are unknown; keep a conservative guard to avoid absurd numbers.
  if (bn.abs().isGreaterThan(new BigNumber('1e22'))) {
    if (config.INVALID_MODEL_OUTPUT_POLICY === 'zero') return '0';
    if (config.INVALID_MODEL_OUTPUT_POLICY === 'skip') throw new Error('SKIP_SUBMISSION');
    throw new Error(`Value ${value} is too large and exceeds the likely limits of BoundedExp40Dec.`);
  }

  const scalingFactor = new BigNumber(10).pow(B_EXP_40_DEC_PRECISION);
  const scaledValue = bn.multipliedBy(scalingFactor);
  return scaledValue.toFixed(0);
}


