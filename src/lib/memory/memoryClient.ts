import {
  Memory,
  MemoryCreateInput,
  MemorySearchResult,
  MemoryStats,
  MemoryCategory
} from './memoryTypes';
import { EmbeddingService } from './embeddingService';

declare global {
  interface Window {
    electronAPI?: {
      memory: {
        add: (memoryData: any) => Promise<{ success: boolean; id?: string; error?: string; duplicate?: boolean; updated?: boolean }>;
        getAll: () => Promise<Memory[]>;
        getByCategory: (category: MemoryCategory) => Promise<Memory[]>;
        update: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
        delete: (id: string) => Promise<{ success: boolean }>;
        clearAll: () => Promise<{ success: boolean; count?: number; error?: string }>;
        getStats: () => Promise<MemoryStats>;
        searchByEmbedding: (embedding: number[], topK?: number) => Promise<MemorySearchResult[]>;
      };
    };
  }
}

export class MemoryClient {
  private static _instance: MemoryClient;
  private _embeddingService: EmbeddingService;

  private constructor() {
    this._embeddingService = EmbeddingService.getInstance();
  }

  public static getInstance(): MemoryClient {
    if (!MemoryClient._instance) {
      MemoryClient._instance = new MemoryClient();
    }
    return MemoryClient._instance;
  }

  public async addMemory(input: MemoryCreateInput): Promise<{ success: boolean; id?: string; duplicate?: boolean; updated?: boolean } | null> {
    if (!window.electronAPI) {
      console.warn('[MemoryClient] Electron API 不可用');
      return null;
    }

    try {
      let embedding: number[] | undefined;
      try {
        embedding = await this._embeddingService.getEmbedding(input.content);
      } catch (error) {
        console.warn('[MemoryClient] 获取向量失败:', error);
      }

      const result = await window.electronAPI.memory.add({
        ...input,
        embedding
      });

      return result;
    } catch (error) {
      console.error('[MemoryClient] 添加记忆失败:', error);
      return null;
    }
  }

  public async getAllMemories(): Promise<Memory[]> {
    if (!window.electronAPI) {
      return [];
    }
    return window.electronAPI.memory.getAll();
  }

  public async getMemoriesByCategory(category: MemoryCategory): Promise<Memory[]> {
    if (!window.electronAPI) {
      return [];
    }
    return window.electronAPI.memory.getByCategory(category);
  }

  public async updateMemory(id: string, updates: Partial<Memory>): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }

    let embedding: number[] | undefined;
    if (updates.content) {
      try {
        embedding = await this._embeddingService.getEmbedding(updates.content);
        updates = { ...updates, embedding };
      } catch (error) {
        console.warn('[MemoryClient] 更新向量失败:', error);
      }
    }

    const result = await window.electronAPI.memory.update(id, updates);
    return result.success;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    const result = await window.electronAPI.memory.delete(id);
    return result.success;
  }

  public async getStats(): Promise<MemoryStats> {
    if (!window.electronAPI) {
      return { totalMemories: 0, categories: {} as Record<MemoryCategory, number>, avgImportance: 0, lastUpdated: new Date() };
    }
    return window.electronAPI.memory.getStats();
  }

  public async searchMemories(query: string, topK: number = 10): Promise<MemorySearchResult[]> {
    if (!window.electronAPI) {
      return [];
    }

    try {
      const embedding = await this._embeddingService.getEmbedding(query);
      return window.electronAPI.memory.searchByEmbedding(embedding, topK);
    } catch (error) {
      console.error('[MemoryClient] 搜索记忆失败:', error);
      return [];
    }
  }

  public async getRelevantMemories(context: string, maxCount: number = 5): Promise<Memory[]> {
    const results = await this.searchMemories(context, maxCount);
    return results.map(r => r.memory);
  }

  public isAvailable(): boolean {
    return !!window.electronAPI?.memory;
  }
}

export const memoryClient = MemoryClient.getInstance();
