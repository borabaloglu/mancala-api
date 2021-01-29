import { IsOptional, IsString, Length } from 'class-validator';

export class JoinGameDto {
  @IsString()
  @Length(1, 30)
  playerName: string;

  @IsOptional()
  @IsString()
  @Length(8)
  gamePin?: string;
}
