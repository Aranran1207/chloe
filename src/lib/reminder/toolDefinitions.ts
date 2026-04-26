import type { ToolDefinition } from '../ai/types';

export const REMINDER_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'set_reminder',
      description: '为用户设置一个提醒。当用户要求你在某个时间提醒他做某事时，【必须】调用此工具来真正设置提醒。系统提示词中已包含当前时间，请根据当前时间直接计算目标时间。datetime 参数使用 ISO 8601 格式。注意：你必须在回复前先调用此工具，不能只在文字中说"已设置提醒"而不实际调用工具！',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '提醒的内容，例如"开会"、"喝水"、"给妈妈打电话"'
          },
          datetime: {
            type: 'string',
            description: '提醒触发的日期时间，ISO 8601 格式，例如 "2026-04-26T15:00:00"'
          },
          repeat: {
            type: 'string',
            enum: ['none', 'daily', 'weekly'],
            description: '重复规则：none=仅一次，daily=每天，weekly=每周同一时间'
          }
        },
        required: ['content', 'datetime']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_reminders',
      description: '查看用户所有待触发的提醒列表。当用户问"我有什么提醒"或"我的日程"时使用。',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_reminder',
      description: '删除一个已设置的提醒。当用户要求取消某个提醒时使用。需要先调用 list_reminders 获取提醒 ID。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '要删除的提醒 ID'
          }
        },
        required: ['id']
      }
    }
  }
];
