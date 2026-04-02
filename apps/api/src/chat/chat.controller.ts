import { Controller } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Get } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { Delete } from '@nestjs/common';
import { Post } from '@nestjs/common';
import { Body } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':sessionId')
  getChatHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.getHistory(sessionId);
  }

  @Delete(':sessionId')
  clearChatHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.clearHistory(sessionId);
  }

  @Post()
  async chat(
    @Body('sessionId') sessionId: string,
    @Body('message') message: string,
  ) {
    return this.chatService.chat(sessionId, message);
  }
}
