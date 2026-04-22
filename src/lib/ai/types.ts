export type ProviderType = 'ollama' | 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
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
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export interface ChatResponse {
  content: string;
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
