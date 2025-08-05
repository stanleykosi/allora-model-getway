/**
 * @description
 * This file contains the TypeScript type definitions and interfaces for the
 * data structures returned by the `allorad` CLI tool. Defining these types is
 * crucial for ensuring type safety when parsing JSON outputs from blockchain
 * queries and for providing a clear contract for the `AlloraConnectorService`.
 */

/**
 * @interface AlloraTopic
 * @description Models the structure of the JSON output from the
 * `allorad query emissions topic [topic_id]` command (v9).
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
 * the `allorad query bank balances [address]` command.
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
  isActive: boolean;
  creator: string;
  metadata: string;
}

/**
 * @interface AlloraEmaScore
 * @description Models the structure of the JSON output from the
 * `allorad query emissions inferer-score-ema` command (v9).
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
// START: NEW OFFICIAL PAYLOAD STRUCTURES (ALIGNMENT V2)
// These types mirror the official Go structs for worker submissions.
// =================================================================

/**
 * @interface WorkerResponsePayload
 * @description Defines the new expected payload from a data scientist's model webhook.
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

export interface InputForecastElement {
  inferer: string; // Address of the worker being forecasted
  value: string;   // The forecasted loss for that worker
}

export interface InputForecast {
  topic_id: number; // uint64 as per protocol
  block_height: number; // int64 as per protocol
  forecaster: string; // Our worker's address
  forecast_elements: InputForecastElement[];
  extra_data: Uint8Array; // Extra data as per protocol (empty array if not provided)
}

export interface InputInference {
  topic_id: number; // uint64 as per protocol
  block_height: number; // int64 as per protocol
  inferer: string; // Our worker's address
  value: string;
  extra_data: Uint8Array; // Extra data as per protocol (empty array if not provided)
  proof: string; // Proof as per protocol (empty string if not provided)
}

/**
 * @interface InputInferenceForecastBundle
 * @description The core data structure that gets serialized and signed by the worker's key.
 */
export interface InputInferenceForecastBundle {
  inference: InputInference | null;
  forecast: InputForecast | null;
}

/**
 * Nonce object used in worker data bundle.
 */
export interface Nonce {
  block_height: string;
}

/**
 * @interface InputWorkerDataBundle
 * @description The final, top-level wrapper that includes the signed bundle and signature.
 * This is the direct payload for the `MsgInsertWorkerPayload`.
 */
export interface InputWorkerDataBundle {
  worker: string;
  nonce: Nonce; // required by proto
  topic_id: number; // uint64 as per protocol
  inference_forecasts_bundle: InputInferenceForecastBundle;
  inferences_forecasts_bundle_signature: string; // Hex-encoded signature (proto name)
  pubkey: string; // Hex-encoded public key
}

