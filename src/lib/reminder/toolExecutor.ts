import type { ToolCall, ToolResult } from '../ai/types';
import { reminderClient } from './reminderClient';
import { REMINDER_TOOLS } from './toolDefinitions';

const toolMap = new Map<string, (...args: any[]) => Promise<any>>();

function registerTool(name: string, executor: (...args: any[]) => Promise<any>) {
  toolMap.set(name, executor);
}

function initTools() {
  registerTool('set_reminder', async (args: { content: string; datetime: string; repeat?: string }) => {
    const result = await reminderClient.addReminder({
      content: args.content,
      triggerAt: args.datetime,
      repeatRule: (args.repeat as any) || 'none'
    });
    if (result.success) {
      return { success: true, id: result.id, message: `已设置提醒：${args.content}，时间：${args.datetime}` };
    }
    return { success: false, error: result.error || '设置提醒失败' };
  });

  registerTool('list_reminders', async () => {
    const reminders = await reminderClient.getAllReminders();
    const pending = reminders.filter(r => r.status === 'pending');
    return {
      count: pending.length,
      reminders: pending.map(r => ({
        id: r.id,
        content: r.content,
        triggerAt: r.triggerAt,
        repeat: r.repeatRule
      }))
    };
  });

  registerTool('delete_reminder', async (args: { id: string }) => {
    const result = await reminderClient.deleteReminder(args.id);
    return result;
  });

  registerTool('get_current_time', async () => {
    const now = new Date();
    return {
      datetime: now.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      formatted: now.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        weekday: 'long'
      })
    };
  });
}

initTools();

export function getAvailableTools() {
  return REMINDER_TOOLS;
}

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  const executor = toolMap.get(toolCall.function.name);
  
  if (!executor) {
    return {
      tool_call_id: toolCall.id,
      content: JSON.stringify({ error: `未知工具: ${toolCall.function.name}` })
    };
  }

  try {
    let args: any = {};
    if (toolCall.function.arguments) {
      args = JSON.parse(toolCall.function.arguments);
    }
    
    console.log(`[ToolExecutor] 执行工具: ${toolCall.function.name}`, args);
    const result = await executor(args);
    console.log(`[ToolExecutor] 工具结果:`, result);
    
    return {
      tool_call_id: toolCall.id,
      content: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error(`[ToolExecutor] 工具执行失败: ${toolCall.function.name}`, error);
    return {
      tool_call_id: toolCall.id,
      content: JSON.stringify({ error: error.message || '工具执行失败' })
    };
  }
}

export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const tc of toolCalls) {
    const result = await executeTool(tc);
    results.push(result);
  }
  return results;
}
