import { IsString, Length } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @Length(1, 30)
  playerName: string;
}
