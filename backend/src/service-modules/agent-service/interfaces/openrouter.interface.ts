export type OpenRouterChatMessage = {
  /** Message author role in OpenRouter chat format. */
  role: 'system' | 'user' | 'assistant';
  /** Plaintext message content. */
  content: string;
};

export type OpenRouterChatCompletionParams = {
  /** OpenRouter model slug (defaults in service). */
  model?: string;
  /** Conversation messages sent to the model. */
  messages: OpenRouterChatMessage[];
  /** Sampling temperature (lower = more deterministic). */
  temperature?: number;
  /** Maximum number of output tokens to generate. */
  maxTokens?: number;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
};
