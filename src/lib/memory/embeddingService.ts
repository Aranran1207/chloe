import { ProviderType } from '../ai';

interface EmbeddingConfig {
  type: ProviderType;
  apiUrl: string;
  apiKey?: string;
  embeddingModel: string;
}

export class EmbeddingService {
  private static _instance: EmbeddingService;
  private _cache: Map<string, number[]> = new Map();
  private _cacheEnabled: boolean = true;
  private _config: EmbeddingConfig | null = null;

  private constructor() {}

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService._instance) {
      EmbeddingService._instance = new EmbeddingService();
    }
    return EmbeddingService._instance;
  }

  public setCacheEnabled(enabled: boolean): void {
    this._cacheEnabled = enabled;
    if (!enabled) {
      this._cache.clear();
    }
  }

  public clearCache(): void {
    this._cache.clear();
  }

  public setConfig(config: EmbeddingConfig): void {
    this._config = config;
    this._cache.clear();
    console.log(`[EmbeddingService] 配置已更新: ${config.type}, 模型: ${config.embeddingModel}`);
  }

  public getConfig(): EmbeddingConfig | null {
    return this._config;
  }

  private loadConfig(): EmbeddingConfig {
    if (this._config) {
      return this._config;
    }

    const saved = localStorage.getItem('aiProviderConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.type === 'openai' && !config.apiKey) {
          console.warn('[EmbeddingService] OpenAI 配置缺少 API Key，回退到 Ollama');
          this._config = {
            type: 'ollama',
            apiUrl: config.apiUrl || 'http://localhost:11434',
            embeddingModel: config.embeddingModel || 'nomic-embed-text-v2-moe:latest'
          };
          return this._config;
        }
        this._config = {
          type: config.type || 'ollama',
          apiUrl: config.apiUrl || 'http://localhost:11434',
          apiKey: config.apiKey,
          embeddingModel: config.embeddingModel || 
            (config.type === 'openai' ? 'text-embedding-3-small' : 'nomic-embed-text-v2-moe:latest')
        };
        return this._config;
      } catch {
        // ignore
      }
    }

    return {
      type: 'ollama',
      apiUrl: 'http://localhost:11434',
      embeddingModel: 'nomic-embed-text-v2-moe:latest'
    };
  }

  public async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.trim().toLowerCase();
    
    if (this._cacheEnabled && this._cache.has(normalizedText)) {
      return this._cache.get(normalizedText)!;
    }

    const config = this.loadConfig();

    try {
      let embedding: number[];

      if (config.type === 'openai') {
        embedding = await this.getOpenAIEmbedding(text, config);
      } else {
        embedding = await this.getOllamaEmbedding(text, config);
      }

      if (this._cacheEnabled) {
        this._cache.set(normalizedText, embedding);
      }

      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] 获取向量失败:', error);
      throw error;
    }
  }

  private async getOllamaEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
    const url = `${config.apiUrl}/api/embeddings`;
    const body = {
      model: config.embeddingModel,
      prompt: text
    };
    
    console.log('[Embedding-Ollama] 请求 URL:', url);
    console.log('[Embedding-Ollama] 请求 Body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Embedding-Ollama] 响应成功，向量维度:', data.embedding?.length);
    return data.embedding as number[];
  }

  private async getOpenAIEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
    const url = `${config.apiUrl}/embeddings`;
    const body = {
      model: config.embeddingModel,
      input: text
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    console.log('[Embedding-OpenAI] 请求 URL:', url);
    console.log('[Embedding-OpenAI] 请求 Body:', JSON.stringify(body, null, 2));
    console.log('[Embedding-OpenAI] API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '未配置');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI Embedding API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    console.log('[Embedding-OpenAI] 响应成功，向量维度:', data.data?.[0]?.embedding?.length);
    return data.data?.[0]?.embedding || [];
  }

  public async getEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.getEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  public findMostSimilar(
    query: number[], 
    candidates: Array<{ embedding: number[]; index: number }>,
    topK: number = 5
  ): Array<{ index: number; similarity: number }> {
    const similarities = candidates.map(c => ({
      index: c.index,
      similarity: this.cosineSimilarity(query, c.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  public async testConnection(): Promise<boolean> {
    const config = this.loadConfig();

    try {
      if (config.type === 'openai') {
        if (!config.apiKey) {
          console.warn('[EmbeddingService] OpenAI API Key 未配置');
          return false;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(`${config.apiUrl}/models`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          console.warn('[EmbeddingService] OpenAI API 连接失败');
          return false;
        }

        console.log('[EmbeddingService] OpenAI API 连接成功');
        return true;
      } else {
        const response = await fetch(`${config.apiUrl}/api/tags`, {
          signal: AbortSignal.timeout(3000)
        });
        
        if (!response.ok) return false;
        
        const data = await response.json();
        const models = data.models || [];
        const hasEmbedModel = models.some((m: { name: string }) => 
          m.name.includes('nomic-embed-text') || m.name.includes('embed')
        );
        
        if (!hasEmbedModel) {
          console.warn('[EmbeddingService] 未找到嵌入模型，请先拉取: ollama pull nomic-embed-text-v2-moe');
        }
        
        console.log('[EmbeddingService] Ollama 连接成功');
        return true;
      }
    } catch (error) {
      console.error('[EmbeddingService] 连接测试失败:', error);
      return false;
    }
  }
}

export const embeddingService = EmbeddingService.getInstance();
