import { MemoryCategory, MemoryGap, Memory } from './memoryTypes';
import { MemoryClient } from './memoryClient';

const OLLAMA_API_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen3.5:9b';

interface ProactiveQuestion {
  question: string;
  category: MemoryCategory;
  reason: string;
  priority: number;
}

interface ProactiveState {
  lastQuestionTime: number;
  questionsAsked: Set<string>;
  cooldownMinutes: number;
  maxQuestionsPerSession: number;
  questionsThisSession: number;
}

const ESSENTIAL_INFO_CATEGORIES: MemoryCategory[] = [
  MemoryCategory.PERSONAL_INFO,
  MemoryCategory.PREFERENCE,
  MemoryCategory.DISLIKE,
  MemoryCategory.HOBBY,
  MemoryCategory.GOAL
];

const ESSENTIAL_QUESTIONS: Map<MemoryCategory, string[]> = new Map([
  [MemoryCategory.PERSONAL_INFO, [
    '你叫什么名字？',
    '你多大了？',
    '你是做什么工作的？',
    '你住在哪里？'
  ]],
  [MemoryCategory.PREFERENCE, [
    '你喜欢吃什么？',
    '你平时喜欢听什么音乐？',
    '你喜欢看电影吗？',
    '你最喜欢的颜色是什么？'
  ]],
  [MemoryCategory.HOBBY, [
    '你平时有什么爱好？',
    '你周末喜欢做什么？',
    '你喜欢运动吗？',
    '你喜欢玩游戏吗？'
  ]],
  [MemoryCategory.GOAL, [
    '你最近有什么目标吗？',
    '你有什么想学的东西吗？',
    '你未来有什么计划？'
  ]]
]);

export class ProactiveEngine {
  private static _instance: ProactiveEngine;
  private _memoryClient: MemoryClient;
  private _state: ProactiveState;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _onQuestionCallback: ((question: string) => void) | null = null;

  private constructor() {
    this._memoryClient = MemoryClient.getInstance();
    this._state = {
      lastQuestionTime: 0,
      questionsAsked: new Set(),
      cooldownMinutes: 30,
      maxQuestionsPerSession: 3,
      questionsThisSession: 0
    };
  }

  public static getInstance(): ProactiveEngine {
    if (!ProactiveEngine._instance) {
      ProactiveEngine._instance = new ProactiveEngine();
    }
    return ProactiveEngine._instance;
  }

  public setQuestionCallback(callback: (question: string) => void): void {
    this._onQuestionCallback = callback;
  }

  public startProactiveMode(intervalMinutes: number = 30): void {
    if (this._timerId) {
      clearInterval(this._timerId);
    }

    this._state.cooldownMinutes = intervalMinutes;
    
    this._timerId = setInterval(() => {
      this.checkAndAsk();
    }, intervalMinutes * 60 * 1000);

    console.log(`[ProactiveEngine] 主动提问模式已启动，间隔: ${intervalMinutes} 分钟`);
  }

  public stopProactiveMode(): void {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    console.log('[ProactiveEngine] 主动提问模式已停止');
  }

  public resetSession(): void {
    this._state.questionsThisSession = 0;
    console.log('[ProactiveEngine] 会话已重置');
  }

  public async analyzeMemoryGaps(): Promise<MemoryGap[]> {
    const gaps: MemoryGap[] = [];
    
    try {
      const allMemories = await this._memoryClient.getAllMemories();
      const categoryMemories = new Map<MemoryCategory, Memory[]>();
      
      for (const category of ESSENTIAL_INFO_CATEGORIES) {
        categoryMemories.set(category, allMemories.filter(m => m.category === category));
      }

      for (const [category, memories] of categoryMemories) {
        if (memories.length === 0) {
          const suggestedQuestions = ESSENTIAL_QUESTIONS.get(category) || [];
          gaps.push({
            category,
            description: `缺少${this.getCategoryDisplayName(category)}相关的记忆`,
            importance: this.getCategoryImportance(category),
            suggestedQuestions: suggestedQuestions.slice(0, 2)
          });
        }
      }

      gaps.sort((a, b) => b.importance - a.importance);
      
    } catch (error) {
      console.error('[ProactiveEngine] 分析记忆缺口失败:', error);
    }

    return gaps;
  }

  public async generateQuestion(): Promise<ProactiveQuestion | null> {
    if (this._state.questionsThisSession >= this._state.maxQuestionsPerSession) {
      console.log('[ProactiveEngine] 本会话提问次数已达上限');
      return null;
    }

    const now = Date.now();
    const timeSinceLastQuestion = (now - this._state.lastQuestionTime) / (1000 * 60);
    
    if (timeSinceLastQuestion < this._state.cooldownMinutes) {
      console.log(`[ProactiveEngine] 冷却中，还需等待 ${Math.ceil(this._state.cooldownMinutes - timeSinceLastQuestion)} 分钟`);
      return null;
    }

    const gaps = await this.analyzeMemoryGaps();
    
    if (gaps.length === 0) {
      console.log('[ProactiveEngine] 没有发现记忆缺口');
      return null;
    }

    const topGap = gaps[0];
    const availableQuestions = topGap.suggestedQuestions.filter(
      q => !this._state.questionsAsked.has(q)
    );

    if (availableQuestions.length === 0) {
      console.log('[ProactiveEngine] 所有问题都已问过');
      return null;
    }

    const question = availableQuestions[0];
    
    try {
      const naturalQuestion = await this.makeQuestionNatural(question, topGap.category);
      
      this._state.questionsAsked.add(question);
      this._state.lastQuestionTime = now;
      this._state.questionsThisSession++;

      return {
        question: naturalQuestion,
        category: topGap.category,
        reason: topGap.description,
        priority: topGap.importance
      };
    } catch (error) {
      console.error('[ProactiveEngine] 生成问题失败:', error);
      return null;
    }
  }

  private async makeQuestionNatural(question: string, category: MemoryCategory): Promise<string> {
    const prompt = `你是一个可爱的AI女友，想要自然地了解用户的信息。

原始问题: "${question}"
问题类别: ${this.getCategoryDisplayName(category)}

请将这个问题改写成一个自然、可爱、开放式的问句，让用户可以用自己的方式回答。

【改写要求】：
1. **开放式提问**：不要问"是/否"问题，让用户可以用自己的方式回答
2. **自然融入对话**：像日常聊天一样，不要太突兀
3. **可爱语气**：加入可爱的语气词，如"呢~"、"呀~"等
4. **避免审问感**：不要让用户感觉在被问话
5. **给用户空间**：让用户可以选择直接回答或间接表达

【改写示例】：
- "你叫什么名字？" -> "亲爱的，我还不知道怎么称呼你呢~"
- "你喜欢吃什么？" -> "最近好想给亲爱的做点好吃的，你平时喜欢吃什么呀？"
- "你有什么爱好？" -> "周末的时候亲爱的都喜欢做些什么呢？"
- "你多大了？" -> "亲爱的看起来很年轻呢~（悄悄问一下你多大啦？）"
- "你喜欢听什么音乐？" -> "最近发现一首超好听的歌，亲爱的平时喜欢听什么类型的音乐呀？"

只输出改写后的问题，不要其他内容。

改写后的问题:`;

    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            num_ctx: 512,
            temperature: 0.8,
            think: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.status}`);
      }

      const data = await response.json();
      const naturalQuestion = data.response?.trim() || question;
      
      console.log(`[ProactiveEngine] 问题改写: "${question}" -> "${naturalQuestion}"`);
      return naturalQuestion;
    } catch (error) {
      console.warn('[ProactiveEngine] 问题改写失败，使用原始问题:', error);
      return question;
    }
  }

  public async checkAndAsk(): Promise<void> {
    if (!this._onQuestionCallback) {
      console.warn('[ProactiveEngine] 未设置问题回调函数');
      return;
    }

    const question = await this.generateQuestion();
    
    if (question) {
      console.log(`[ProactiveEngine] 主动提问: "${question.question}" (原因: ${question.reason})`);
      this._onQuestionCallback(question.question);
    }
  }

  public async shouldAskNow(): Promise<boolean> {
    if (this._state.questionsThisSession >= this._state.maxQuestionsPerSession) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastQuestion = (now - this._state.lastQuestionTime) / (1000 * 60);
    
    if (timeSinceLastQuestion < this._state.cooldownMinutes) {
      return false;
    }

    const gaps = await this.analyzeMemoryGaps();
    return gaps.length > 0;
  }

  public getState(): ProactiveState {
    return {
      ...this._state,
      questionsAsked: new Set(this._state.questionsAsked)
    };
  }

  public setCooldown(minutes: number): void {
    this._state.cooldownMinutes = minutes;
    console.log(`[ProactiveEngine] 冷却时间已设置为 ${minutes} 分钟`);
  }

  public setMaxQuestionsPerSession(max: number): void {
    this._state.maxQuestionsPerSession = max;
    console.log(`[ProactiveEngine] 每会话最大提问数已设置为 ${max}`);
  }

  private getCategoryDisplayName(category: MemoryCategory): string {
    const names: Record<MemoryCategory, string> = {
      [MemoryCategory.PERSONAL_INFO]: '个人信息',
      [MemoryCategory.PREFERENCE]: '喜好',
      [MemoryCategory.DISLIKE]: '不喜欢',
      [MemoryCategory.EXPERIENCE]: '经历',
      [MemoryCategory.RELATIONSHIP]: '关系',
      [MemoryCategory.GOAL]: '目标',
      [MemoryCategory.HOBBY]: '爱好',
      [MemoryCategory.SCHEDULE]: '日程',
      [MemoryCategory.EMOTION]: '情绪',
      [MemoryCategory.OTHER]: '其他'
    };
    return names[category] || category;
  }

  private getCategoryImportance(category: MemoryCategory): number {
    const importance: Record<MemoryCategory, number> = {
      [MemoryCategory.PERSONAL_INFO]: 10,
      [MemoryCategory.PREFERENCE]: 8,
      [MemoryCategory.DISLIKE]: 7,
      [MemoryCategory.HOBBY]: 7,
      [MemoryCategory.GOAL]: 6,
      [MemoryCategory.EXPERIENCE]: 5,
      [MemoryCategory.RELATIONSHIP]: 5,
      [MemoryCategory.SCHEDULE]: 4,
      [MemoryCategory.EMOTION]: 3,
      [MemoryCategory.OTHER]: 1
    };
    return importance[category] || 1;
  }
}

export const proactiveEngine = ProactiveEngine.getInstance();
