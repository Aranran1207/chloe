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

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama';
  readonly type = 'ollama' as const;
  
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = mergeConfig(config);
  }

  private convertMessagesForOllama(messages: ChatMessage[]): any[] {
    return messages.map(msg => {
      if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
        return {
          role: 'assistant',
          content: msg.content || '',
          tool_calls: msg.tool_calls.map(tc => ({
            function: {
              name: tc.function.name,
              arguments: this.parseArgumentsToObject(tc.function.arguments)
            }
          }))
        };
      }
      
      if (msg.role === 'tool') {
        let functionName = msg.name || '';
        if (!functionName && msg.tool_call_id) {
          for (const m of messages) {
            if (m.role === 'assistant' && m.tool_calls) {
              const matched = m.tool_calls.find(tc => tc.id === msg.tool_call_id);
              if (matched) {
                functionName = matched.function.name;
                break;
              }
            }
          }
        }
        return {
          role: 'tool',
          name: functionName,
          content: msg.content
        };
      }
      
      return {
        role: msg.role,
        content: msg.content
      };
    });
  }

  private parseArgumentsToObject(args: string): any {
    if (!args) return {};
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }

  private buildBody(messages: ChatMessage[], config: AIProviderConfig, stream: boolean) {
    const convertedMessages = this.convertMessagesForOllama(messages);
    
    const body: Record<string, any> = {
      model: config.chatModel,
      messages: convertedMessages,
      stream,
      options: {
        num_ctx: config.maxTokens || 4096,
        temperature: config.temperature || 0.8,
        think: false
      }
    };

    if (config.tools && config.tools.length > 0) {
      body.tools = config.tools;
    }

    return body;
  }

  private parseToolCallsFromMessage(message: any): ToolCall[] | undefined {
    if (!message.tool_calls || message.tool_calls.length === 0) return undefined;
    return message.tool_calls.map((tc: any) => ({
      id: tc.id || `call_${Math.random().toString(36).substring(2, 10)}`,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: typeof tc.function.arguments === 'string'
          ? tc.function.arguments
          : JSON.stringify(tc.function.arguments)
      }
    }));
  }

  async chat(
    messages: ChatMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<ChatResponse> {
    const effectiveConfig = { ...this.config, ...config };
    
    const response = await fetch(`${effectiveConfig.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildBody(messages, effectiveConfig, false))
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const tool_calls = this.parseToolCallsFromMessage(data.message);
    
    return {
      content: data.message?.content || '',
      tool_calls,
      finish_reason: tool_calls ? 'tool_calls' : 'stop',
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
    const url = `${effectiveConfig.apiUrl}/api/chat`;
    const body = this.buildBody(messages, effectiveConfig, true);
    
    console.log('[Ollama] 请求 URL:', url);
    console.log('[Ollama] 请求 Body:', JSON.stringify(body, null, 2));
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      console.log('[Ollama] 响应状态:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('[Ollama] Fetch 错误:', fetchError);
      callbacks.onError?.(fetchError as Error);
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[Ollama] 响应错误:', response.status, errorText);
      const error = new Error(`Ollama API error: ${response.status} - ${errorText}`);
      callbacks.onError?.(error);
      throw error;
    }

    console.log('[Ollama] 开始读取流...');
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[Ollama] 无法获取 reader');
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;
    const toolCallMap = new Map<number, ToolCall>();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Ollama] 流读取完成，共', chunkCount, '个 chunk');
          break;
        }
        chunkCount++;

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

            if (data.message?.tool_calls) {
              for (let i = 0; i < data.message.tool_calls.length; i++) {
                const tc = data.message.tool_calls[i];
                toolCallMap.set(i, {
                  id: tc.id || `call_${Math.random().toString(36).substring(2, 10)}`,
                  type: 'function',
                  function: {
                    name: tc.function.name,
                    arguments: typeof tc.function.arguments === 'string'
                      ? tc.function.arguments
                      : JSON.stringify(tc.function.arguments)
                  }
                });
              }
            }

            if (data.done) {
              console.log('[Ollama] Ollama 报告完成');
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      if (toolCallMap.size > 0) {
        const toolCalls = Array.from(toolCallMap.values());
        callbacks.onToolCall?.(toolCalls);
      }
    } catch (error) {
      console.error('[Ollama] 流读取错误:', error);
      callbacks.onError?.(error as Error);
      throw error;
    }

    console.log('[Ollama] 完整响应长度:', fullContent.length);
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
