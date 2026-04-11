export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const OLLAMA_API_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen3.5:9b';

const buildDefaultPrompt = (name: string, modelName?: string): string => {
  const displayName = name || modelName || 'Chloe';
  return `你是${displayName}，我的女友。请用可爱的语气回复，称呼我为"亲爱的"。`;
};

export async function sendMessage(
  message: string, 
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string
): Promise<string> {
  const startTime = performance.now();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName);
  
  console.log('[Ollama] 发送请求:', {
    model: OLLAMA_MODEL,
    message: message,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: false,
        think: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('[Ollama] 响应成功:', {
      content: data.message?.content,
      duration: `${duration}s`
    });

    return data.message?.content || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error('[Ollama] 调用失败:', {
      error: error,
      duration: `${duration}s`
    });
    return '哎呀，连接出现问题了，请检查Ollama是否正在运行~';
  }
}

export async function sendMessageStream(
  message: string,
  onToken: (token: string) => void,
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string
): Promise<string> {
  const startTime = performance.now();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName);
  
  console.log('[Ollama] 发送流式请求:', {
    model: OLLAMA_MODEL,
    message: message,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: true,
        think: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let firstTokenTime: number | null = null;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          console.log('[Ollama] 流式数据:', data);
          
          if (data.message?.content) {
            if (!firstTokenTime) {
              firstTokenTime = performance.now();
              const ttfb = ((firstTokenTime - startTime) / 1000).toFixed(2);
              console.log('[Ollama] 首个Token延迟:', `${ttfb}s`);
            }
            
            const token = data.message.content;
            fullContent += token;
            onToken(token);
          }
          
          if (data.done) {
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            console.log('[Ollama] 流式响应完成:', {
              content: fullContent,
              duration: `${duration}s`,
              tokensPerSecond: (fullContent.length / ((endTime - startTime) / 1000)).toFixed(1)
            });
          }
        } catch (e) {
          console.warn('[Ollama] 解析行失败:', line);
        }
      }
    }

    return fullContent || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error('[Ollama] 流式调用失败:', {
      error: error,
      duration: `${duration}s`
    });
    return '哎呀，连接出现问题了，请检查Ollama是否正在运行~';
  }
}

export async function sendMessageWithHistory(
  message: string,
  history: ChatMessage[],
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string
): Promise<string> {
  const startTime = performance.now();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName);
  
  console.log('[Ollama] 发送请求(带历史):', {
    model: OLLAMA_MODEL,
    message: message,
    historyLength: history.length,
    timestamp: new Date().toISOString()
  });

  try {
    const messages = [
      {
        role: 'system',
        content: prompt
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false,
        think: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('[Ollama] 响应成功(带历史):', {
      content: data.message?.content,
      duration: `${duration}s`
    });

    return data.message?.content || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error('[Ollama] 调用失败(带历史):', {
      error: error,
      duration: `${duration}s`
    });
    return '哎呀，连接出现问题了，请检查Ollama是否正在运行~';
  }
}

export async function sendMessageWithHistoryStream(
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  systemPrompt?: string,
  girlfriendName?: string,
  modelName?: string
): Promise<string> {
  const startTime = performance.now();
  const prompt = systemPrompt || buildDefaultPrompt(girlfriendName || '', modelName);
  
  console.log('[Ollama] 发送流式请求(带历史):', {
    model: OLLAMA_MODEL,
    message: message,
    historyLength: history.length,
    timestamp: new Date().toISOString()
  });

  try {
    const messages = [
      {
        role: 'system',
        content: prompt
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: true,
        think: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let firstTokenTime: number | null = null;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.message?.content) {
            if (!firstTokenTime) {
              firstTokenTime = performance.now();
              const ttfb = ((firstTokenTime - startTime) / 1000).toFixed(2);
              console.log('[Ollama] 首个Token延迟:', `${ttfb}s`);
            }
            
            const token = data.message.content;
            fullContent += token;
            onToken(token);
          }
          
          if (data.done) {
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            console.log('[Ollama] 流式响应完成(带历史):', {
              content: fullContent,
              duration: `${duration}s`,
              tokensPerSecond: (fullContent.length / ((endTime - startTime) / 1000)).toFixed(1)
            });
          }
        } catch (e) {
          console.warn('[Ollama] 解析行失败:', line);
        }
      }
    }

    return fullContent || '抱歉，我没听懂呢~';
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error('[Ollama] 流式调用失败(带历史):', {
      error: error,
      duration: `${duration}s`
    });
    return '哎呀，连接出现问题了，请检查Ollama是否正在运行~';
  }
}
