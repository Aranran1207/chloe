import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  Memory,
  MemoryCreateInput,
  MemoryUpdateInput,
  MemorySearchResult,
  MemoryStats,
  MemoryCategory,
  MemorySettings,
  DefaultMemorySettings
} from './memoryTypes';
import { EmbeddingService } from './embeddingService';

const DB_VERSION = 1;

export class MemoryService {
  private static _instance: MemoryService;
  private _db: Database.Database | null = null;
  private _dbPath: string;
  private _embeddingService: EmbeddingService;
  private _settings: MemorySettings;
  private _embeddingCache: Map<string, number[]> = new Map();

  private constructor() {
    this._dbPath = '';
    this._embeddingService = EmbeddingService.getInstance();
    this._settings = { ...DefaultMemorySettings };
  }

  public static getInstance(): MemoryService {
    if (!MemoryService._instance) {
      MemoryService._instance = new MemoryService();
    }
    return MemoryService._instance;
  }

  public initialize(dbPath: string): boolean {
    try {
      this._dbPath = dbPath;
      this._db = new Database(dbPath);
      
      this._db.pragma('journal_mode = WAL');
      this._db.pragma('synchronous = NORMAL');
      
      this.createTables();
      this.loadSettings();
      
      console.log('[MemoryService] 数据库初始化成功:', dbPath);
      return true;
    } catch (error) {
      console.error('[MemoryService] 数据库初始化失败:', error);
      return false;
    }
  }

  private createTables(): void {
    if (!this._db) return;

    this._db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        importance INTEGER DEFAULT 5,
        confidence REAL DEFAULT 0.8,
        embedding BLOB,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_accessed TEXT,
        access_count INTEGER DEFAULT 0,
        last_modified TEXT DEFAULT CURRENT_TIMESTAMP,
        source TEXT,
        related_message_id TEXT,
        tags TEXT,
        question_asked INTEGER DEFAULT 0,
        follow_up_questions TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_last_accessed ON memories(last_accessed);
      CREATE INDEX IF NOT EXISTS idx_created_at ON memories(created_at);
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    const versionRow = this._db.prepare('SELECT value FROM metadata WHERE key = ?').get('db_version') as { value: string } | undefined;
    if (!versionRow) {
      this._db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)').run('db_version', DB_VERSION.toString());
    }
  }

  private loadSettings(): void {
    if (!this._db) return;

    const row = this._db.prepare('SELECT value FROM settings WHERE key = ?').get('memory_settings') as { value: string } | undefined;
    if (row) {
      try {
        this._settings = { ...DefaultMemorySettings, ...JSON.parse(row.value) };
      } catch (e) {
        console.warn('[MemoryService] 加载设置失败，使用默认设置');
      }
    }
  }

  public saveSettings(): void {
    if (!this._db) return;
    this._db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('memory_settings', JSON.stringify(this._settings));
  }

  public getSettings(): MemorySettings {
    return { ...this._settings };
  }

  public updateSettings(settings: Partial<MemorySettings>): void {
    this._settings = { ...this._settings, ...settings };
    this.saveSettings();
  }

  public async addMemory(input: MemoryCreateInput): Promise<Memory> {
    if (!this._db) throw new Error('数据库未初始化');

    const id = uuidv4();
    const now = new Date().toISOString();
    
    let embedding: number[] | undefined;
    if (this._settings.enabled) {
      try {
        embedding = await this._embeddingService.getEmbedding(input.content);
      } catch (error) {
        console.warn('[MemoryService] 获取向量失败，记忆将无向量:', error);
      }
    }

    const memory: Memory = {
      id,
      content: input.content,
      category: input.category,
      importance: input.importance ?? 5,
      confidence: input.confidence ?? 0.8,
      embedding,
      createdAt: new Date(now),
      lastAccessed: new Date(now),
      accessCount: 0,
      lastModified: new Date(now),
      source: input.source ?? { type: 'manual' },
      tags: input.tags ?? [],
      questionAsked: false
    };

    const stmt = this._db.prepare(`
      INSERT INTO memories (
        id, content, category, importance, confidence, embedding,
        created_at, last_accessed, access_count, last_modified,
        source, tags, question_asked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      memory.id,
      memory.content,
      memory.category,
      memory.importance,
      memory.confidence,
      embedding ? Buffer.from(new Float64Array(embedding).buffer) : null,
      memory.createdAt.toISOString(),
      memory.lastAccessed.toISOString(),
      memory.accessCount,
      memory.lastModified.toISOString(),
      JSON.stringify(memory.source),
      JSON.stringify(memory.tags),
      memory.questionAsked ? 1 : 0
    );

    if (embedding) {
      this._embeddingCache.set(id, embedding);
    }

    console.log('[MemoryService] 添加记忆:', memory.content.substring(0, 50) + '...');
    return memory;
  }

  public async updateMemory(id: string, updates: MemoryUpdateInput): Promise<Memory | null> {
    if (!this._db) throw new Error('数据库未初始化');

    const existing = this.getMemoryById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updatedMemory = { ...existing, ...updates, lastModified: new Date(now) };

    if (updates.content && updates.content !== existing.content) {
      try {
        updatedMemory.embedding = await this._embeddingService.getEmbedding(updates.content);
        this._embeddingCache.set(id, updatedMemory.embedding!);
      } catch (error) {
        console.warn('[MemoryService] 更新向量失败:', error);
      }
    }

    const stmt = this._db.prepare(`
      UPDATE memories SET
        content = ?, category = ?, importance = ?, confidence = ?,
        embedding = ?, last_accessed = ?, access_count = ?, last_modified = ?,
        tags = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedMemory.content,
      updatedMemory.category,
      updatedMemory.importance,
      updatedMemory.confidence,
      updatedMemory.embedding ? Buffer.from(new Float64Array(updatedMemory.embedding).buffer) : null,
      updatedMemory.lastAccessed.toISOString(),
      updatedMemory.accessCount,
      updatedMemory.lastModified.toISOString(),
      JSON.stringify(updatedMemory.tags),
      id
    );

    return updatedMemory;
  }

  public deleteMemory(id: string): boolean {
    if (!this._db) throw new Error('数据库未初始化');

    this._embeddingCache.delete(id);
    const result = this._db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public getMemoryById(id: string): Memory | null {
    if (!this._db) throw new Error('数据库未初始化');

    const row = this._db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as any;
    return row ? this.rowToMemory(row) : null;
  }

  public getAllMemories(): Memory[] {
    if (!this._db) throw new Error('数据库未初始化');

    const rows = this._db.prepare('SELECT * FROM memories ORDER BY importance DESC, created_at DESC').all() as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  public getMemoriesByCategory(category: MemoryCategory): Memory[] {
    if (!this._db) throw new Error('数据库未初始化');

    const rows = this._db.prepare('SELECT * FROM memories WHERE category = ? ORDER BY importance DESC').all(category) as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  public async searchMemories(query: string, topK: number = 10): Promise<MemorySearchResult[]> {
    if (!this._db) throw new Error('数据库未初始化');

    const queryEmbedding = await this._embeddingService.getEmbedding(query);
    
    const rows = this._db.prepare('SELECT * FROM memories WHERE embedding IS NOT NULL').all() as any[];
    
    const candidates = rows.map(row => {
      let embedding = this._embeddingCache.get(row.id);
      if (!embedding && row.embedding) {
        embedding = Array.from(new Float64Array(row.embedding));
        this._embeddingCache.set(row.id, embedding);
      }
      return { row, embedding: embedding! };
    }).filter(c => c.embedding);

    const similarities = candidates.map(({ row, embedding }) => ({
      row,
      similarity: this._embeddingService.cosineSimilarity(queryEmbedding, embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    const results = similarities
      .filter(s => s.similarity >= this._settings.relevanceThreshold)
      .slice(0, topK)
      .map(s => ({
        memory: this.rowToMemory(s.row),
        similarity: s.similarity
      }));

    results.forEach(result => {
      this.updateMemory(result.memory.id, {
        accessCount: result.memory.accessCount + 1,
        lastAccessed: new Date()
      });
    });

    return results;
  }

  public async getRelevantMemories(context: string, maxCount: number = 5): Promise<Memory[]> {
    const results = await this.searchMemories(context, maxCount);
    return results.map(r => r.memory);
  }

  public getStats(): MemoryStats {
    if (!this._db) throw new Error('数据库未初始化');

    const totalRow = this._db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };
    const categoryRows = this._db.prepare('SELECT category, COUNT(*) as count FROM memories GROUP BY category').all() as { category: string; count: number }[];
    const avgRow = this._db.prepare('SELECT AVG(importance) as avg FROM memories').get() as { avg: number | null };
    const lastRow = this._db.prepare('SELECT MAX(last_modified) as last FROM memories').get() as { last: string | null };

    const categories: Record<MemoryCategory, number> = {} as Record<MemoryCategory, number>;
    Object.values(MemoryCategory).forEach(cat => {
      categories[cat] = 0;
    });
    categoryRows.forEach(row => {
      categories[row.category as MemoryCategory] = row.count;
    });

    return {
      totalMemories: totalRow.count,
      categories,
      avgImportance: avgRow.avg ?? 0,
      lastUpdated: lastRow.last ? new Date(lastRow.last) : new Date()
    };
  }

  private rowToMemory(row: any): Memory {
    let embedding: number[] | undefined;
    if (row.embedding) {
      embedding = Array.from(new Float64Array(row.embedding));
    }

    return {
      id: row.id,
      content: row.content,
      category: row.category as MemoryCategory,
      importance: row.importance,
      confidence: row.confidence,
      embedding,
      createdAt: new Date(row.created_at),
      lastAccessed: row.last_accessed ? new Date(row.last_accessed) : new Date(row.created_at),
      accessCount: row.access_count ?? 0,
      lastModified: new Date(row.last_modified),
      source: row.source ? JSON.parse(row.source) : { type: 'manual' },
      relatedMessageId: row.related_message_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      questionAsked: row.question_asked === 1,
      followUpQuestions: row.follow_up_questions ? JSON.parse(row.follow_up_questions) : undefined
    };
  }

  public close(): void {
    if (this._db) {
      this._db.close();
      this._db = null;
      this._embeddingCache.clear();
      console.log('[MemoryService] 数据库已关闭');
    }
  }

  public async testEmbedding(): Promise<boolean> {
    try {
      await this._embeddingService.getEmbedding('测试');
      return true;
    } catch (error) {
      console.error('[MemoryService] 向量嵌入测试失败:', error);
      return false;
    }
  }
}

export const memoryService = MemoryService.getInstance();
