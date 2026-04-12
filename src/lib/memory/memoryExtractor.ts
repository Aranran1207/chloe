import {
  MemoryCategory,
  ExtractedMemory
} from './memoryTypes';

const OLLAMA_API_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen3.5:9b';

const EXTRACTION_PROMPT = `你是一个记忆提取助手。分析以下对话，从【用户消息】中提取关于用户的新信息。

对话内容：
【用户消息】：{userMessage}
【AI回复】：{aiResponse}

请从【用户消息】中提取用户透露的个人信息，以JSON格式返回：
{
  "memories": [
    {
      "content": "用户的名字叫张三",
      "category": "personal",
      "importance": 7,
      "confidence": 0.95,
      "tags": ["名字", "个人信息"]
    }
  ]
}

【重要规则】：
1. **只从【用户消息】中提取信息**，不要从【AI回复】中提取任何内容
2. AI回复只是上下文参考，帮助理解对话场景
3. 如果用户消息中没有透露任何新的个人信息，返回空数组：{"memories": []}
4. 只提取明确提到的信息，不要猜测或推断
5. importance 范围 1-10：
   - 1-3: 琐碎信息（如"今天吃了苹果"）
   - 4-6: 一般信息（如"我喜欢看电影"）
   - 7-8: 重要信息（如"我的生日是3月15日"）
   - 9-10: 核心信息（如"我叫张三"、"我是程序员"）
6. confidence 范围 0-1，表示提取的确定性
7. category 必须是以下之一：
   - "personal": 个人信息（名字、生日、职业、住址等）
   - "preference": 喜好（喜欢的食物、颜色、音乐等）
   - "dislike": 不喜欢的事物
   - "hobby": 爱好（运动、游戏、阅读等）
   - "relationship": 关系（家人、朋友、宠物等）
   - "goal": 目标（想做的事、梦想等）
   - "schedule": 日程（明天要开会、周末有约等）
   - "emotion": 情绪状态（最近压力大、很开心等）
   - "experience": 经历（去过的地方、做过的事等）
   - "other": 其他
8. tags 是关键词数组，便于检索

只返回JSON，不要有其他内容。`;

export class MemoryExtractor {
  private static _instance: MemoryExtractor;

  private constructor() {}

  public static getInstance(): MemoryExtractor {
    if (!MemoryExtractor._instance) {
      MemoryExtractor._instance = new MemoryExtractor();
    }
    return MemoryExtractor._instance;
  }

  public async extractFromConversation(
    userMessage: string,
    aiResponse: string
  ): Promise<ExtractedMemory[]> {
    try {
      const prompt = EXTRACTION_PROMPT
        .replace('{userMessage}', userMessage)
        .replace('{aiResponse}', aiResponse);

      const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false,
          think: false,
          options: {
            num_ctx: 2048,
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.message?.content || '';
      
      const memories = this.parseExtractionResult(content);
      
      if (memories.length > 0) {
        console.log('[MemoryExtractor] 提取到记忆:', memories);
      }
      
      return memories;
    } catch (error) {
      console.error('[MemoryExtractor] 提取失败:', error);
      return [];
    }
  }

  private parseExtractionResult(content: string): ExtractedMemory[] {
    try {
      let jsonStr = content.trim();
      
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const result = JSON.parse(jsonStr);
      
      if (!result.memories || !Array.isArray(result.memories)) {
        return [];
      }
      
      const validCategories = Object.values(MemoryCategory);
      
      return result.memories.filter((m: any) => {
        if (!m.content || typeof m.content !== 'string') return false;
        if (!validCategories.includes(m.category)) {
          m.category = MemoryCategory.OTHER;
        }
        m.importance = Math.max(1, Math.min(10, m.importance || 5));
        m.confidence = Math.max(0, Math.min(1, m.confidence || 0.8));
        m.tags = Array.isArray(m.tags) ? m.tags : [];
        return true;
      });
    } catch (error) {
      console.warn('[MemoryExtractor] 解析 JSON 失败:', content.substring(0, 100));
      return [];
    }
  }

  public shouldExtract(message: string): boolean {
    const personalKeywords = [
      '我叫', '我的名字', '我是', '我今年', '我的生日',
      '我喜欢', '我爱吃', '我爱', '我讨厌', '我不喜欢',
      '我家', '我的家人', '我的朋友', '我的宠物',
      '我在', '我在做', '我的工作', '我的职业',
      '我想', '我希望', '我的梦想', '我的目标',
      '明天我要', '周末', '下周', '今天',
      '我最近', '我心情', '我感觉', '我很开心', '我很难过'
    ];
    
    const lowerMessage = message.toLowerCase();
    return personalKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export const memoryExtractor = MemoryExtractor.getInstance();
