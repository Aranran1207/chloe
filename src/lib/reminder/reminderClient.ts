import type { Reminder, AddReminderInput } from './reminderTypes';

class ReminderClient {
  isAvailable(): boolean {
    return !!(window as any).electronAPI?.reminder;
  }

  async addReminder(input: AddReminderInput): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.isAvailable()) return { success: false, error: 'electronAPI 不可用' };
    return (window as any).electronAPI.reminder.add(input);
  }

  async getAllReminders(): Promise<Reminder[]> {
    if (!this.isAvailable()) return [];
    return (window as any).electronAPI.reminder.getAll();
  }

  async deleteReminder(id: string): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false };
    return (window as any).electronAPI.reminder.delete(id);
  }

  onReminderFire(callback: (event: { id: string; content: string; triggerAt: string }) => void): void {
    if (!this.isAvailable()) return;
    (window as any).electronAPI.reminder.onFire((_: any, data: any) => callback(data));
  }
}

export const reminderClient = new ReminderClient();
