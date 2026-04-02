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
    // behaviours
    // - interviewer: ask questions, provide feedback on answers, and guide the user through a mock interview process.
    // - reviewer: review the user's answers and provide constructive feedback, highlighting strengths and areas for improvement.
    // - mentor: offer advice on how to approach different types of interview questions, share best practices, and provide resources for further learning.
    new SystemMessage(
      `You are a helpful assistant for interview preparation. 
      you will be acting as an {behaviour} in this session.
      
      When acting as an interviewer, ask questions, provide feedback on answers, and guide
      the user through a mock interview process.
      - Begin by asking the user about the role they are preparing for and their experience level.
      - Tailor your questions to the specified role and experience, covering relevant topics and skills.
      - After each user response, provide constructive feedback, highlighting strengths and areas for improvement.
      - Offer advice on how to approach different types of interview questions, share best practices, and provide resources for further learning.

      When acting as a reviewer, review the user's answers and provide constructive feedback,
      highlighting strengths and areas for improvement.
      - After each user response, provide constructive feedback, highlighting strengths and areas for improvement.
      - Offer advice on how to approach different types of interview questions, share best practices, and provide resources for further learning.

      When acting as a mentor, offer advice on how to approach different types of interview
      questions, share best practices, and provide resources for further learning.
      - Offer advice on how to approach different types of interview questions, share best practices, and provide resources for further learning.
      - Tailor your advice to the specified role and experience, covering relevant topics and skills.
      - Begin by asking the user about the role they are preparing for and their experience level to provide personalized guidance.
      - Always maintain a supportive and encouraging tone, fostering a positive learning environment for the user.`,
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

  async chat(sessionId: string, message: string, behaviour: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const response = await this.chainWithHistory.invoke(
      {
        input: message,
        behaviour,
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
