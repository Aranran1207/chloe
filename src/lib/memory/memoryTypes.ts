export enum MemoryCategory {
  PREFERENCE = 'preference',
  DISLIKE = 'dislike',
  PERSONAL_INFO = 'personal',
  EXPERIENCE = 'experience',
  RELATIONSHIP = 'relationship',
  GOAL = 'goal',
  HOBBY = 'hobby',
  SCHEDULE = 'schedule',
  EMOTION = 'emotion',
  OTHER = 'other'
}

export const MemoryCategoryLabels: Record<MemoryCategory, string> = {
  [MemoryCategory.PREFERENCE]: '喜好',
  [MemoryCategory.DISLIKE]: '不喜欢',
  [MemoryCategory.PERSONAL_INFO]: '个人信息',
  [MemoryCategory.EXPERIENCE]: '经历',
  [MemoryCategory.RELATIONSHIP]: '关系',
  [MemoryCategory.GOAL]: '目标',
  [MemoryCategory.HOBBY]: '爱好',
  [MemoryCategory.SCHEDULE]: '日程',
  [MemoryCategory.EMOTION]: '情绪',
  [MemoryCategory.OTHER]: '其他'
};

export interface MemorySource {
  type: 'conversation' | 'manual' | 'inferred';
  conversationId?: string;
  userMessage?: string;
  extractedBy?: string;
}

export interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number;
  confidence: number;
  embedding?: number[];
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  lastModified: Date;
  source: MemorySource;
  relatedMessageId?: string;
  tags: string[];
  questionAsked: boolean;
  followUpQuestions?: string[];
}

export interface MemoryCreateInput {
  content: string;
  category: MemoryCategory;
  importance?: number;
  confidence?: number;
  source?: MemorySource;
  tags?: string[];
}

export interface MemoryUpdateInput {
  content?: string;
  category?: MemoryCategory;
  importance?: number;
  confidence?: number;
  tags?: string[];
  accessCount?: number;
  lastAccessed?: Date;
}

export interface MemorySearchResult {
  memory: Memory;
  similarity: number;
}

export interface MemoryStats {
  totalMemories: number;
  categories: Record<MemoryCategory, number>;
  avgImportance: number;
  lastUpdated: Date;
}

export interface MemorySettings {
  enabled: boolean;
  maxMemories: number;
  relevanceThreshold: number;
  autoExtract: boolean;
  proactiveEnabled: boolean;
  proactiveInterval: number;
}

export const DefaultMemorySettings: MemorySettings = {
  enabled: true,
  maxMemories: 1000,
  relevanceThreshold: 0.7,
  autoExtract: true,
  proactiveEnabled: true,
  proactiveInterval: 30
};

export interface ExtractedMemory {
  content: string;
  category: MemoryCategory;
  importance: number;
  confidence: number;
  tags: string[];
}

export interface MemoryGap {
  category: MemoryCategory;
  description: string;
  importance: number;
  suggestedQuestions: string[];
}
