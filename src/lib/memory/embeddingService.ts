const OLLAMA_API_URL = 'http://localhost:11434';
const OLLAMA_EMBED_MODEL = 'nomic-embed-text-v2-moe:latest';

export class EmbeddingService {
  private static _instance: EmbeddingService;
  private _cache: Map<string, number[]> = new Map();
  private _cacheEnabled: boolean = true;

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

  public async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.trim().toLowerCase();
    
    if (this._cacheEnabled && this._cache.has(normalizedText)) {
      return this._cache.get(normalizedText)!;
    }

    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_EMBED_MODEL,
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      const embedding = data.embedding as number[];

      if (this._cacheEnabled) {
        this._cache.set(normalizedText, embedding);
      }

      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] 获取向量失败:', error);
      throw error;
    }
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
    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const models = data.models || [];
      const hasEmbedModel = models.some((m: { name: string }) => 
        m.name.includes('nomic-embed-text')
      );
      
      if (!hasEmbedModel) {
        console.warn('[EmbeddingService] 未找到 nomic-embed-text 模型，请先拉取: ollama pull nomic-embed-text-v2-moe');
      }
      
      return true;
    } catch (error) {
      console.error('[EmbeddingService] Ollama 连接测试失败:', error);
      return false;
    }
  }
}

export const embeddingService = EmbeddingService.getInstance();
