import {
  Memory,
  MemoryCategory,
  MemoryCategoryLabels
} from './memoryTypes';

export class MemoryIntegrator {
  private static _instance: MemoryIntegrator;

  private constructor() {}

  public static getInstance(): MemoryIntegrator {
    if (!MemoryIntegrator._instance) {
      MemoryIntegrator._instance = new MemoryIntegrator();
    }
    return MemoryIntegrator._instance;
  }

  public buildMemoryPrompt(
    basePrompt: string,
    memories: Memory[],
    context?: string
  ): string {
    if (memories.length === 0) {
      return basePrompt;
    }

    const memorySection = this.formatMemoriesForPrompt(memories);
    
    const enhancedPrompt = `${basePrompt}

【关于"亲爱的"的记忆】
以下是你记得的关于他的重要信息：

${memorySection}

请在回复中自然地体现你记得这些信息，让对话更加贴心。如果当前话题与某些记忆相关，可以适当提及。`;

    return enhancedPrompt;
  }

  public formatMemoriesForPrompt(memories: Memory[]): string {
    const groupedMemories = this.groupMemoriesByCategory(memories);
    const sections: string[] = [];

    const categoryOrder: MemoryCategory[] = [
      MemoryCategory.PERSONAL_INFO,
      MemoryCategory.PREFERENCE,
      MemoryCategory.DISLIKE,
      MemoryCategory.HOBBY,
      MemoryCategory.RELATIONSHIP,
      MemoryCategory.GOAL,
      MemoryCategory.SCHEDULE,
      MemoryCategory.EMOTION,
      MemoryCategory.EXPERIENCE,
      MemoryCategory.OTHER
    ];

    for (const category of categoryOrder) {
      const items = groupedMemories[category];
      if (items && items.length > 0) {
        const label = MemoryCategoryLabels[category];
        const formattedItems = items
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 5)
          .map(m => `- ${m.content}`)
          .join('\n');
        
        sections.push(`**${label}：**\n${formattedItems}`);
      }
    }

    return sections.join('\n\n');
  }

  private groupMemoriesByCategory(memories: Memory[]): Record<MemoryCategory, Memory[]> {
    const grouped: Record<MemoryCategory, Memory[]> = {} as Record<MemoryCategory, Memory[]>;
    
    for (const category of Object.values(MemoryCategory)) {
      grouped[category] = [];
    }
    
    for (const memory of memories) {
      grouped[memory.category].push(memory);
    }
    
    return grouped;
  }

  public formatMemoryForDisplay(memory: Memory): string {
    const categoryLabel = MemoryCategoryLabels[memory.category];
    const importance = '⭐'.repeat(Math.min(memory.importance, 5));
    return `[${categoryLabel}] ${importance}\n${memory.content}`;
  }

  public buildMemorySummary(memories: Memory[]): string {
    if (memories.length === 0) {
      return '暂无记忆';
    }

    const stats = this.getMemoryStats(memories);
    return `共 ${memories.length} 条记忆，平均重要性 ${stats.avgImportance.toFixed(1)}`;
  }

  private getMemoryStats(memories: Memory[]): { avgImportance: number } {
    if (memories.length === 0) {
      return { avgImportance: 0 };
    }
    
    const totalImportance = memories.reduce((sum, m) => sum + m.importance, 0);
    return {
      avgImportance: totalImportance / memories.length
    };
  }

  public shouldIncludeMemory(memory: Memory, context: string): boolean {
    const contextLower = context.toLowerCase();
    const contentLower = memory.content.toLowerCase();
    
    for (const tag of memory.tags) {
      if (contextLower.includes(tag.toLowerCase())) {
        return true;
      }
    }
    
    const keywords = contentLower.split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length >= 2 && contextLower.includes(keyword)) {
        return true;
      }
    }
    
    return memory.importance >= 8;
  }

  public filterRelevantMemories(memories: Memory[], context: string, maxCount: number = 10): Memory[] {
    const relevantMemories = memories.filter(m => this.shouldIncludeMemory(m, context));
    
    return relevantMemories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxCount);
  }
}

export const memoryIntegrator = MemoryIntegrator.getInstance();
