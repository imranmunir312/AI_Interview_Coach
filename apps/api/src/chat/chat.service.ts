import { ChatOllama } from '@langchain/ollama';
import { Injectable } from '@nestjs/common';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from './roles.enum';

@Injectable()
export class ChatService {
  private readonly model = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1',
    temperature: 0.7,
  });

  private readonly chatPromptTemplate = ChatPromptTemplate.fromMessages([
    new SystemMessage(
      `You are a helpful assistant for practicing coding interviews in {language}.
      - Provide clear and concise explanations.
      - If the user asks for code, provide well-formatted code snippets.
      - Always ask follow-up questions to keep the conversation going.
      - Be encouraging and supportive.
      
      Example conversation:
      User: "Can you explain what a binary search tree is?"
      Assistant: "A binary search tree is a data structure that allows for fast lookup, addition, and removal of items. It is organized in a hierarchical manner where each node has at most two children, referred to as the left and right child. The left child contains values less than the parent node, while the right child contains values greater than the parent node."`,
    ),
    new MessagesPlaceholder('history'),
    new HumanMessage('{input}'),
  ]);

  private readonly chain = this.chatPromptTemplate.pipe(this.model);

  private readonly chainWithHistory = new RunnableWithMessageHistory({
    runnable: this.chain,
    getMessageHistory: async (sessionId: string) => {
      const history = await this.getHistory(sessionId);
      const chatHistory = this.toLangChainMessages(history);

      const chatMessageHistory = new InMemoryChatMessageHistory(
        chatHistory ?? [],
      );

      return chatMessageHistory;
    },
    inputMessagesKey: 'input',
    historyMessagesKey: 'history',
  });

  constructor(
    @InjectRepository(User)
    private readonly chatRepository: Repository<User>,
  ) {}

  private toLangChainMessages(messages: User[]): BaseMessage[] {
    return messages.map((msg) => {
      switch (msg.role) {
        case Role.USER:
          return new HumanMessage(msg.content);
        case Role.ASSISTANT:
          return new AIMessage(msg.content);
        default:
          return new SystemMessage(msg.content);
      }
    });
  }

  async chat(sessionId: string, message: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const response = await this.chainWithHistory.invoke(
      {
        input: message,
        language: 'JavaScript',
      },
      {
        configurable: {
          sessionId,
        },
      },
    );

    const assistantResponse =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    await this.chatRepository.save({
      sessionId,
      role: Role.USER,
      content: message,
    });
    await this.chatRepository.save({
      sessionId,
      role: Role.ASSISTANT,
      content: assistantResponse,
    });

    return {
      reply: assistantResponse,
      sessionId,
      historyLength: (await this.getHistory(sessionId)).length,
    };
  }

  async getHistory(sessionId: string) {
    return await this.chatRepository.find({ where: { sessionId } });
  }

  async clearHistory(sessionId: string) {
    await this.chatRepository.delete({ sessionId });
    return { message: 'Chat history cleared', sessionId };
  }
}
