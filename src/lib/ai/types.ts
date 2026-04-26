export type ProviderType = 'ollama' | 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCallFunction {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: ToolCallFunction;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ToolResult {
  tool_call_id: string;
  content: string;
}

export interface AIProviderConfig {
  type: ProviderType;
  apiUrl: string;
  apiKey?: string;
  chatModel: string;
  embeddingModel?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolCalls: ToolCall[]) => void;
}

export interface ChatResponse {
  content: string;
  tool_calls?: ToolCall[];
  finish_reason?: 'stop' | 'tool_calls' | 'length';
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly type: ProviderType;
  
  chat(
    messages: ChatMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<ChatResponse>;
  
  chatStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    config?: Partial<AIProviderConfig>
  ): Promise<string>;
  
  getEmbedding?(
    text: string,
    config?: Partial<AIProviderConfig>
  ): Promise<EmbeddingResponse>;
  
  isAvailable(): Promise<boolean>;
  
  getModels?(): Promise<string[]>;
}

export interface AIProviderFactory {
  createProvider(config: AIProviderConfig): AIProvider;
}

export const DEFAULT_CONFIGS: Record<ProviderType, Partial<AIProviderConfig>> = {
  ollama: {
    apiUrl: 'http://localhost:11434',
    chatModel: 'qwen3.5:9b',
    embeddingModel: 'nomic-embed-text-v2-moe:latest',
    temperature: 0.8,
    maxTokens: 4096
  },
  openai: {
    apiUrl: 'https://api.openai.com/v1',
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    temperature: 0.8,
    maxTokens: 4096
  }
};

export function mergeConfig(
  config: AIProviderConfig
): AIProviderConfig {
  const defaults = DEFAULT_CONFIGS[config.type] || {};
  return {
    ...defaults,
    ...config
  } as AIProviderConfig;
}
