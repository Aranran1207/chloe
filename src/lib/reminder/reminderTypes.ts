export type ReminderRepeat = 'none' | 'daily' | 'weekly';

export type ReminderStatus = 'pending' | 'fired' | 'dismissed';

export interface Reminder {
  id: string;
  content: string;
  triggerAt: string;
  repeatRule: ReminderRepeat;
  status: ReminderStatus;
  createdAt: string;
  lastFiredAt?: string;
  nextTriggerAt?: string;
}

export interface AddReminderInput {
  content: string;
  triggerAt: string;
  repeatRule?: ReminderRepeat;
}

export interface ReminderFireEvent {
  id: string;
  content: string;
  triggerAt: string;
}
