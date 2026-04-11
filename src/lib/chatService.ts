export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const mockResponses = [
  "你好呀！今天想聊什么呢？",
  "嗯...让我想想该怎么回答你~",
  "这个话题很有趣呢！",
  "我明白了，继续说吧~",
  "哇，真的吗？太棒了！",
  "让我思考一下...",
  "你说得对呢！",
  "这个问题有点难，不过我会努力的！",
  "嘿嘿，谢谢你的关心~",
  "今天天气真不错呢！",
];

export async function sendMessage(message: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  let response = mockResponses[randomIndex];
  
  if (message.includes('名字') || message.includes('叫什么')) {
    response = "我叫Chloe，很高兴认识你！";
  } else if (message.includes('你好') || message.includes('嗨') || message.includes('hi')) {
    response = "你好呀！今天过得怎么样？";
  } else if (message.includes('喜欢')) {
    response = "我喜欢的事情有很多呢，比如和你聊天~";
  } else if (message.includes('再见') || message.includes('拜拜')) {
    response = "再见啦！下次再聊哦~";
  } else if (message.includes('?') || message.includes('？')) {
    response = "这是个好问题！让我想想...";
  }
  
  return response;
}

export async function sendMessageWithHistory(
  message: string,
  _history: ChatMessage[]
): Promise<string> {
  return sendMessage(message);
}
