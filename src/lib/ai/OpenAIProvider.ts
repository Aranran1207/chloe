import {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  StreamCallbacks,
  ToolCall,
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

  private buildBody(messages: ChatMessage[], config: AIProviderConfig, stream: boolean) {
    const body: Record<string, any> = {
      model: config.chatModel,
      messages,
      temperature: config.temperature || 0.8,
      max_tokens: config.maxTokens,
      stream
    };

    if (config.tools && config.tools.length > 0) {
      body.tools = config.tools;
      body.tool_choice = config.toolChoice || 'auto';
    }

    return body;
  }

  private parseToolCallsFromMessage(message: any): ToolCall[] | undefined {
    if (!message.tool_calls || message.tool_calls.length === 0) return undefined;
    return message.tool_calls.map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));
  }

  async chat(
    messages: ChatMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<ChatResponse> {
    const effectiveConfig = { ...this.config, ...config };
    
    const response = await fetch(`${effectiveConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(effectiveConfig),
      body: JSON.stringify(this.buildBody(messages, effectiveConfig, false))
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const tool_calls = this.parseToolCallsFromMessage(choice?.message);
    
    return {
      content,
      tool_calls,
      finish_reason: choice?.finish_reason,
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
    const url = `${effectiveConfig.apiUrl}/chat/completions`;
    const body = this.buildBody(messages, effectiveConfig, true);
    
    console.log('[OpenAI] 请求 URL:', url);
    console.log('[OpenAI] 请求 Body:', JSON.stringify(body, null, 2));
    console.log('[OpenAI] API Key:', effectiveConfig.apiKey ? `${effectiveConfig.apiKey.substring(0, 10)}...` : '未配置');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(effectiveConfig),
      body: JSON.stringify(body)
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
    const toolCallMap = new Map<number, ToolCall>();

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
              const delta = data.choices?.[0]?.delta;
              
              if (delta?.content) {
                fullContent += delta.content;
                callbacks.onToken(delta.content);
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index;
                  if (!toolCallMap.has(idx)) {
                    toolCallMap.set(idx, {
                      id: tc.id || '',
                      type: 'function',
                      function: {
                        name: tc.function?.name || '',
                        arguments: tc.function?.arguments || ''
                      }
                    });
                  } else {
                    const existing = toolCallMap.get(idx)!;
                    if (tc.id) existing.id = tc.id;
                    if (tc.function?.name) existing.function.name += tc.function.name;
                    if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
                  }
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      if (toolCallMap.size > 0) {
        const toolCalls = Array.from(toolCallMap.values());
        callbacks.onToolCall?.(toolCalls);
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
