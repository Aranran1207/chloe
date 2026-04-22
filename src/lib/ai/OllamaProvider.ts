import {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  StreamCallbacks,
  mergeConfig
} from './types';

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama';
  readonly type = 'ollama' as const;
  
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = mergeConfig(config);
  }

  async chat(
    messages: ChatMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<ChatResponse> {
    const effectiveConfig = { ...this.config, ...config };
    
    const response = await fetch(`${effectiveConfig.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: effectiveConfig.chatModel,
        messages,
        stream: false,
        options: {
          num_ctx: effectiveConfig.maxTokens || 4096,
          temperature: effectiveConfig.temperature || 0.8,
          think: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.message?.content || '',
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }

  async chatStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    config?: Partial<AIProviderConfig>
  ): Promise<string> {
    const effectiveConfig = { ...this.config, ...config };
    
    const response = await fetch(`${effectiveConfig.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: effectiveConfig.chatModel,
        messages,
        stream: true,
        options: {
          num_ctx: effectiveConfig.maxTokens || 4096,
          temperature: effectiveConfig.temperature || 0.8,
          think: false
        }
      })
    });

    if (!response.ok) {
      const error = new Error(`Ollama API error: ${response.status}`);
      callbacks.onError?.(error);
      throw error;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              const token = data.message.content;
              fullContent += token;
              callbacks.onToken(token);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(error as Error);
      throw error;
    }

    callbacks.onComplete?.(fullContent);
    return fullContent;
  }

  async getEmbedding(
    text: string,
    config?: Partial<AIProviderConfig>
  ): Promise<EmbeddingResponse> {
    const effectiveConfig = { ...this.config, ...config };
    const embeddingModel = effectiveConfig.embeddingModel || 'nomic-embed-text-v2-moe:latest';
    
    const response = await fetch(`${effectiveConfig.apiUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: embeddingModel,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      embedding: data.embedding || [],
      tokens: data.prompt_eval_count
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch {
      return [];
    }
  }
}
