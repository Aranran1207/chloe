import {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  StreamCallbacks,
  mergeConfig
} from './types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly type = 'openai' as const;
  
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = mergeConfig(config);
  }

  private getHeaders(config: AIProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    return headers;
  }

  async chat(
    messages: ChatMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<ChatResponse> {
    const effectiveConfig = { ...this.config, ...config };
    
    const response = await fetch(`${effectiveConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(effectiveConfig),
      body: JSON.stringify({
        model: effectiveConfig.chatModel,
        messages,
        temperature: effectiveConfig.temperature || 0.8,
        max_tokens: effectiveConfig.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      }
    };
  }

  async chatStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    config?: Partial<AIProviderConfig>
  ): Promise<string> {
    const effectiveConfig = { ...this.config, ...config };
    
    const response = await fetch(`${effectiveConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(effectiveConfig),
      body: JSON.stringify({
        model: effectiveConfig.chatModel,
        messages,
        temperature: effectiveConfig.temperature || 0.8,
        max_tokens: effectiveConfig.maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
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
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              const token = data.choices?.[0]?.delta?.content;
              if (token) {
                fullContent += token;
                callbacks.onToken(token);
              }
            } catch {
              // Skip invalid JSON
            }
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
    const embeddingModel = effectiveConfig.embeddingModel || 'text-embedding-3-small';
    
    const response = await fetch(`${effectiveConfig.apiUrl}/embeddings`, {
      method: 'POST',
      headers: this.getHeaders(effectiveConfig),
      body: JSON.stringify({
        model: embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI embedding API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    
    return {
      embedding: data.data?.[0]?.embedding || [],
      tokens: data.usage?.total_tokens
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.config.apiUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(this.config),
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    if (!this.config.apiKey) {
      return [];
    }
    
    try {
      const response = await fetch(`${this.config.apiUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(this.config)
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => 
          id.includes('gpt') || 
          id.includes('claude') || 
          id.includes('chat')
        );
    } catch {
      return [];
    }
  }
}
