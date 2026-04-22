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
    const url = `${effectiveConfig.apiUrl}/api/chat`;
    const body = {
      model: effectiveConfig.chatModel,
      messages,
      stream: true,
      options: {
        num_ctx: effectiveConfig.maxTokens || 4096,
        temperature: effectiveConfig.temperature || 0.8,
        think: false
      }
    };
    
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
            if (data.done) {
              console.log('[Ollama] Ollama 报告完成');
            }
          } catch {
            // Skip invalid JSON
          }
        }
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
