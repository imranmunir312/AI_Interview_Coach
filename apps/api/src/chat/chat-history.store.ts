import { Injectable } from '@nestjs/common';

export type StoredChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  creaetedAt: Date;
};

@Injectable()
export class ChatHistoryStore {
  private readonly store = new Map<string, StoredChatMessage[]>();

  getMessages(sessionId: string): StoredChatMessage[] {
    return this.store.get(sessionId) ?? [];
  }

  appendMessage(
    sessionId: string,
    message: Omit<StoredChatMessage, 'creaetedAt'>,
  ) {
    const messages = this.getMessages(sessionId);
    messages.push({ ...message, creaetedAt: new Date() });
    this.store.set(sessionId, messages);
  }

  clearMessages(sessionId: string) {
    this.store.delete(sessionId);
  }
}
