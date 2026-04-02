import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatHistoryStore } from './chat-history.store';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [ChatService, ChatHistoryStore],
  controllers: [ChatController],
})
export class ChatModule {}
