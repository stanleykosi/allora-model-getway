/**
 * @description
 * This file defines the Zod validation schemas for the /models API endpoints.
 * Zod schemas provide robust, declarative, and type-safe validation for
 * incoming request data, ensuring data integrity before it reaches the
 * service layer.
 *
 * @dependencies
 * - zod: A TypeScript-first schema declaration and validation library.
 */
import { z } from 'zod';

/**
 * @description
 * Schema for validating the request body of the model registration endpoint (`POST /api/v1/models`).
 *
 * @validations
 * - `webhook_url`: Must be a valid URL string. This is the endpoint the server will call for inferences.
 * - `topic_id`: Must be a non-empty string. This identifies the Allora topic.
 * - `model_type`: Must be one of the enum values "inference" or "forecaster".
 * - `max_gas_price`: An optional string representing the maximum gas price the user is willing to pay (e.g., "10uallo").
 */
export const registerModelSchema = z.object({
  body: z.object({
    webhook_url: z.string({
      required_error: 'webhook_url is required',
    }).url({
      message: 'webhook_url must be a valid URL',
    }),
    topic_id: z.string({
      required_error: 'topic_id is required',
    }).min(1, {
      message: 'topic_id cannot be empty',
    }),
    is_inferer: z.boolean().default(true),
    is_forecaster: z.boolean().default(false),
    max_gas_price: z.string().optional(),
  }).refine(data => data.is_inferer || data.is_forecaster, {
    message: "Model must be at least an inferer or a forecaster.",
    path: ["is_inferer"],
  }),
});


/**
 * @description
 * Schema for validating the request parameters of the model performance endpoint (`GET /api/v1/models/:modelId/performance`).
 *
 * @validations
 * - `modelId`: Must be a valid UUID string. This is the ID of the model whose performance is being requested.
 */
export const getModelPerformanceSchema = z.object({
  params: z.object({
    modelId: z.string().uuid({ message: "Model ID must be a valid UUID." }),
  }),
}); 