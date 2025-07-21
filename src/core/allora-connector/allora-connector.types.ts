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
 * `allorad query emissions get-topic [topic_id]` command.
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
 * @interface InferenceData
 * @description Represents the data structure expected from a model's webhook response.
 * The core information is the predicted `value`.
 */
export interface InferenceData {
  value: string;
}

/**
 * @interface Inference
 * @description Defines the structure of the inference to be included in the
 * MsgInsertInference transaction payload.
 */
export interface Inference {
  topic_id: string;
  block_height: string;
  value: string;
}

/**
 * @interface MsgInsertInference
 * @description Represents the structure of the custom message for submitting an inference
 * to the Allora chain's `emissions` module.
 */
export interface MsgInsertInference {
  sender: string;
  inferences: Inference[];
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
 * details of a topic required by the MCP server. This is the primary object
 * returned by the connector service's `getTopicDetails` method.
 */
export interface TopicDetails {
  id: string;
  epochLength: number;
  isActive: boolean;
  creator: string;
}

/**
 * @interface AlloraEmaScore
 * @description Models the structure of the JSON output from the
 * `allorad query emissions get-worker-ema-score` command.
 */
export interface AlloraEmaScore {
  score: string;
}

/**
 * @interface AlloraWorkerPerformance
 * @description A consolidated data structure for a worker's performance on a topic.
 */
export interface AlloraWorkerPerformance {
  emaScore: string;
  // other future performance metrics can be added here
} 