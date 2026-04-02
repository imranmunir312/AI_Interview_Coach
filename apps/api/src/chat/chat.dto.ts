import { IsNotEmpty, IsString } from 'class-validator';

export class ChatDto {
  @IsString({ message: 'Session ID must be a string' })
  @IsNotEmpty({ message: 'Session ID cannot be empty' })
  sessionId: string;

  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  message: string;
}
