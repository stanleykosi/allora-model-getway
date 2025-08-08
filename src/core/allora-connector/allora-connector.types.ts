/**
 * @description
 * This file contains the TypeScript type definitions and interfaces for
 * data structures returned by the Allora network APIs and services.
 */

/**
 * @interface AlloraTopic
 * @description Models the structure of the API output for
 * `GET /emissions/v9/topics/{topic_id}` (v9).
 */
export interface AlloraTopic {
  topic_id: string;
  creator: string;
  metadata: string;
  loss_logic: string;
  loss_method: string;
  epoch_length: string; // Comes as a string from the CLI
  ground_truth_lag: string;
  inference_cadence: string;
  p_norm: string;
  alpha_regret: string;
  allow_negative: boolean;
  epsilon: string;
}

/**
 * @interface AlloraBalance
 * @description Models a single balance entry from the `balances` array returned by
 * `GET /cosmos/bank/v1beta1/balances/{address}`.
 */
export interface AlloraBalance {
  denom: string;
  amount: string;
}








/**
 * @type ExecResult
 * @description Represents the outcome of an external command execution.
 * It's a tuple where the first element is the stdout string (on success) or null
 * (on failure), and the second is the error object (on failure) or null (on success).
 */
export type ExecResult = [string | null, Error | null];


/**
 * @interface TopicDetails
 * @description A consolidated and cleaned-up data structure representing the essential
 * details of a topic required by the HTTP server. This is the primary object
 * returned by the connector service's `getTopicDetails` method.
 */
export interface TopicDetails {
  id: string;
  epochLength: number;
  workerSubmissionWindow?: number;
  epochLastEnded?: number;
  isActive: boolean;
  creator: string;
  metadata: string;
}

/**
 * @interface AlloraEmaScore
 * @description Models the structure of the API output for
 * `GET /emissions/v9/inferer_score_ema/{topicId}/{workerAddress}` (v9).
 */
export interface AlloraEmaScore {
  score: string;
}

/**
 * @interface AlloraWorkerPerformance
 * @description A consolidated data structure for a worker's performance on a topic.
 */
export interface AlloraWorkerPerformance {
  topicId: string;
  workerAddress: string;
  emaScore: string;
  // other future performance metrics can be added here
}

// =================================================================
// WORKER RESPONSE PAYLOAD - Used by webhook interface
// =================================================================

/**
 * @interface WorkerResponsePayload
 * @description Defines the expected payload from a data scientist's model webhook.
 * A model can now return both an inference and forecasts.
 */
export interface WorkerResponsePayload {
  inferenceValue: string;
  forecasts?: Array<{
    workerAddress: string;
    forecastedValue: string;
  }>;
  // Optional protocol data that can be passed through to the chain
  extraData?: Uint8Array; // Additional data for inference
  proof?: string; // Cryptographic proof for inference
  forecastExtraData?: Uint8Array; // Additional data for forecast
}

