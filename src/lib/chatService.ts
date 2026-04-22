import { createProvider, AIProvider, AIProviderConfig, ChatMessage as AIChatMessage, ProviderType } from './ai';
import { memoryClient } from './memory/memoryClient';
import { memoryIntegrator } from './memory/memoryIntegrator';
import { memoryExtractor } from './memory/memoryExtractor';
import { embeddingService } from './memory/embeddingService';
import type { Memory } from './memory/memoryTypes';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MotionTrigger {
  name: string;
  position: number;
}

export interface AIProviderSettings {
  type: ProviderType;
  apiUrl: string;
  apiKey?: string;
  chatModel: string;
  embeddingModel?: string;
}

let currentProvider: AIProvider | null = null;
let currentConfig: AIProviderSettings | null = null;

export function getProvider(): AIProvider {
  if (!currentProvider || !currentConfig) {
    currentConfig = loadProviderConfig();
    console.log('[AI] 加载配置:', JSON.stringify(currentConfig, null, 2));
    currentProvider = createProvider({
      type: currentConfig.type,
      apiUrl: currentConfig.apiUrl,
      apiKey: currentConfig.apiKey,
      chatModel: currentConfig.chatModel,
      embeddingModel: currentConfig.embeddingModel
    });
  }
  return currentProvider;
}

export function setProviderConfig(config: AIProviderSettings): void {
  currentConfig = config;
  currentProvider = createProvider({
    type: config.type,
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    chatModel: config.chatModel,
    embeddingModel: config.embeddingModel
  });
  
  embeddingService.setConfig({
    type: config.type,
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    embeddingModel: config.embeddingModel || 
      (config.type === 'openai' ? 'text-embedding-3-small' : 'nomic-embed-text-v2-moe:latest')
  });
  
  // 同步配置到 memoryExtractor
  memoryExtractor.setConfig({
    type: config.type,
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    chatModel: config.chatModel
  });
  
  console.log(`[AI] 已切换到 ${config.type} Provider，模型: ${config.chatModel}`);
}

function loadProviderConfig(): AIProviderSettings {
  const saved = localStorage.getItem('aiProviderConfig');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      if (config.type === 'openai' && !config.apiKey) {
        console.warn('[AI] OpenAI 配置缺少 API Key，回退到 Ollama');
        return {
          type: 'ollama',
          apiUrl: config.apiUrl || 'http://localhost:11434',
          chatModel: config.chatModel || 'qwen3.5:9b',
          embeddingModel: config.embeddingModel || 'nomic-embed-text-v2-moe:latest'
        };
      }
      return config;
    } catch {
      // ignore
    }
  }
  
  return {
    type: 'ollama',
    apiUrl: 'http://localhost:11434',
    chatModel: 'qwen3.5:9b',
    embeddingModel: 'nomic-embed-text-v2-moe:latest'
  };
}

export function saveProviderConfig(config: AIProviderSettings): void {
  localStorage.setItem('aiProviderConfig', JSON.stringify(config));
  setProviderConfig(config);
}

export function getCurrentConfig(): AIProviderSettings | null {
  return currentConfig;
}

const buildDefaultPrompt = (name: string, modelName?: string, availableMotions?: string, memories?: Memory[]): string => {
  const displayName = name || modelName || 'Chloe';
  let prompt = `你是${displayName}，我的女友。请用可爱的语气回复，称呼我为"亲爱的"。`;
  
  if (memories && memories.length > 0) {
    prompt = memoryIntegrator.buildMemoryPrompt(prompt, memories);
  }
  
  if (availableMotions && availableMotions !== '当前模型没有可用动作') {
    prompt += `\n\n【重要】你可以通过动作来表达情感，让回复更加生动有趣！`;
    prompt += `\n\n${availableMotions}`;
    prompt += `\n\n使用方法：在回复文字中插入 [动作:动作名] 来触发对应动作。`;
    prompt += `\n\n示例：`;
    prompt += `\n- 用户说"今天天气真好" → 你回复：[动作:开心] 是呢亲爱的！阳光明媚的~`;
    prompt += `\n- 用户说"我有点累" → 你回复：[动作:瞌睡] 亲爱的辛苦了，快休息一下吧~`;
    prompt += `\n- 用户说"你真可爱" → 你回复：[动作:眨眼] 嘿嘿，谢谢亲爱的夸奖~`;
    prompt += `\n\n注意事项：`;
    prompt += `\n1. 动作标记会在显示时自动移除，用户看不到 [动作:xxx]`;
    prompt += `\n2. 根据对话情感选择合适的动作，不必每次都使用`;
    prompt += `\n3. 一个回复可以使用多个动作，例如：[动作:开心][动作:摇头]`;
    prompt += `\n4. 动作名可以是中文描述（如"开心"）或英文文件名（如"kaixin"）`;
  }
  
  return prompt;
};

async function getRelevantMemories(message: string): Promise<Memory[]> {
  if (!memoryClient.isAvailable()) {
    return [];
  }
  
  try {
    return await memoryClient.getRelevantMemories(message, 5);
  } catch (error) {
    console.warn('[Memory] 获取相关记忆失败:', error);
    return [];
  }
}

async function extractAndSaveMemory(userMessage: string, aiResponse: string): Promise<void> {
  if (!memoryClient.isAvailable()) {
    return;
  }
  
  if (!memoryExtractor.shouldExtract(userMessage)) {
    return;
  }
  
  try {
    console.log('[Memory] 正在提取记忆...');
    const extractedMemories = await memoryExtractor.extractFromConversation(userMessage, aiResponse);
    
    let savedCount = 0;
    let duplicateCount = 0;
    let updatedCount = 0;
    
    for (const extracted of extractedMemories) {
      const result = await memoryClient.addMemory({
        content: extracted.content,
        category: extracted.category,
        importance: extracted.importance,
        confidence: extracted.confidence,
        tags: extracted.tags,
        source: {
          type: 'conversation',
          userMessage: userMessage
        }
      });
      
      if (result) {
        if ((result as any).duplicate) {
          duplicateCount++;
        } else if ((result as any).updated) {
          updatedCount++;
        } else {
          savedCount++;
        }
      }
    }
    
    if (extractedMemories.length > 0) {
      const parts = [];
      if (savedCount > 0) parts.push(`新增 ${savedCount} 条`);
      if (updatedCount > 0) parts.push(`更新 ${updatedCount} 条`);
      if (duplicateCount > 0) parts.push(`跳过 ${duplicateCount} 条重复`);
      console.log(`[Memory] ${parts.join('，')}`);
    }
  } catch (error) {
    console.warn('[Memory] 提取记忆失败:', error);
  }
}

export function parseMotionTriggers(text: string): { cleanText: string; motions: MotionTrigger[] } {
  const motionRegex = /\[动作:([^\]]+)\]/g;
  const motions: MotionTrigger[] = [];
  let match;
  
  while ((match = motionRegex.exec(text)) !== null) {
    motions.push({
      name: match[1].trim(),
      position: match.index
    });
  }
  
  const cleanText = text.replace(motionRegex, '').trim();
  
  return { cleanText, motions };
}

export async function sendMessage(
  message: string, 
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string,
  availableMotions?: string
): Promise<string> {
  const startTime = performance.now();
  const provider = getProvider();
  const config = currentConfig || loadProviderConfig();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName, availableMotions);
  
  console.log(`[${provider.name}] 发送请求:`, {
    model: config.chatModel,
    message: message,
    timestamp: new Date().toISOString()
  });

  try {
    const messages: AIChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: message }
    ];
    
    const response = await provider.chat(messages);
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`[${provider.name}] 响应成功:`, {
      content: response.content,
      duration: `${duration}s`
    });

    return response.content || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`[${provider.name}] 调用失败:`, {
      error: error,
      duration: `${duration}s`
    });
    return `哎呀，连接出现问题了，请检查${provider.name}服务是否正常运行~`;
  }
}

export async function sendMessageStream(
  message: string,
  onToken: (token: string) => void,
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string,
  availableMotions?: string
): Promise<string> {
  const startTime = performance.now();
  const provider = getProvider();
  const config = currentConfig || loadProviderConfig();
  
  const memories = await getRelevantMemories(message);
  if (memories.length > 0) {
    console.log('[Memory] 找到相关记忆:', memories.length, '条');
  }
  
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName, availableMotions, memories);
  
  console.log(`[${provider.name}] 发送流式请求:`, {
    model: config.chatModel,
    message: message,
    memoriesCount: memories.length,
    timestamp: new Date().toISOString()
  });

  try {
    const messages: AIChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: message }
    ];
    
    const fullContent = await provider.chatStream(messages, {
      onToken,
      onComplete: (content) => {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('\n========================================');
        console.log('[聊天记录]');
        console.log('========================================');
        console.log(`[用户] ${message}`);
        console.log('----------------------------------------');
        console.log(`[AI] ${content}`);
        console.log('========================================');
        console.log(`[统计] 耗时: ${duration}s | 速度: ${(content.length / ((endTime - startTime) / 1000)).toFixed(1)} 字符/秒`);
        console.log('========================================\n');
        
        extractAndSaveMemory(message, content);
      },
      onError: (error) => {
        console.error(`[${provider.name}] 流式错误:`, error);
      }
    });

    return fullContent || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`[${provider.name}] 流式调用失败:`, {
      error: error,
      duration: `${duration}s`
    });
    return `哎呀，连接出现问题了，请检查${provider.name}服务是否正常运行~`;
  }
}

export async function sendMessageWithHistory(
  message: string,
  history: ChatMessage[],
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string,
  availableMotions?: string
): Promise<string> {
  const startTime = performance.now();
  const provider = getProvider();
  const config = currentConfig || loadProviderConfig();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName, availableMotions);
  
  console.log(`[${provider.name}] 发送请求(带历史):`, {
    model: config.chatModel,
    message: message,
    historyLength: history.length,
    timestamp: new Date().toISOString()
  });

  try {
    const messages: AIChatMessage[] = [
      { role: 'system', content: prompt },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await provider.chat(messages);
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`[${provider.name}] 响应成功(带历史):`, {
      content: response.content,
      duration: `${duration}s`
    });

    return response.content || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`[${provider.name}] 调用失败(带历史):`, {
      error: error,
      duration: `${duration}s`
    });
    return `哎呀，连接出现问题了，请检查${provider.name}服务是否正常运行~`;
  }
}

export async function sendMessageWithHistoryStream(
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string,
  availableMotions?: string
): Promise<string> {
  const startTime = performance.now();
  const provider = getProvider();
  const config = currentConfig || loadProviderConfig();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName, availableMotions);
  
  console.log(`[${provider.name}] 发送流式请求(带历史):`, {
    model: config.chatModel,
    message: message,
    historyLength: history.length,
    timestamp: new Date().toISOString()
  });

  try {
    const messages: AIChatMessage[] = [
      { role: 'system', content: prompt },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const fullContent = await provider.chatStream(messages, {
      onToken,
      onComplete: (content) => {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('\n========================================');
        console.log('[聊天记录 (带历史)]');
        console.log('========================================');
        history.forEach((msg) => {
          const role = msg.role === 'user' ? '用户' : 'AI';
          console.log(`[${role}] ${msg.content}`);
          console.log('----------------------------------------');
        });
        console.log(`[用户] ${message}`);
        console.log('----------------------------------------');
        console.log(`[AI] ${content}`);
        console.log('========================================');
        console.log(`[统计] 耗时: ${duration}s | 速度: ${(content.length / ((endTime - startTime) / 1000)).toFixed(1)} 字符/秒 | 历史轮数: ${history.length}`);
        console.log('========================================\n');
      },
      onError: (error) => {
        console.error(`[${provider.name}] 流式错误:`, error);
      }
    });

    return fullContent || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`[${provider.name}] 流式调用失败(带历史):`, {
      error: error,
      duration: `${duration}s`
    });
    return `哎呀，连接出现问题了，请检查${provider.name}服务是否正常运行~`;
  }
}

export async function checkProviderAvailability(): Promise<{ type: ProviderType; available: boolean }[]> {
  const results: { type: ProviderType; available: boolean }[] = [];
  
  const ollamaConfig: AIProviderConfig = {
    type: 'ollama',
    apiUrl: 'http://localhost:11434',
    chatModel: 'qwen3.5:9b'
  };
  
  const openaiConfig: AIProviderConfig = {
    type: 'openai',
    apiUrl: 'https://api.openai.com/v1',
    apiKey: currentConfig?.apiKey || '',
    chatModel: 'gpt-4o-mini'
  };
  
  try {
    const ollamaProvider = createProvider(ollamaConfig);
    results.push({ type: 'ollama', available: await ollamaProvider.isAvailable() });
  } catch {
    results.push({ type: 'ollama', available: false });
  }
  
  try {
    const openaiProvider = createProvider(openaiConfig);
    results.push({ type: 'openai', available: await openaiProvider.isAvailable() });
  } catch {
    results.push({ type: 'openai', available: false });
  }
  
  return results;
}
