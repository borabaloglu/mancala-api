import { IsInt, Max, Min } from 'class-validator';

import gameConfig from '../../../shared/configs/game.config';

export class MakeMoveDto {
  @IsInt()
  @Min(0)
  @Max(gameConfig.numberOfPits - 2)
  selectedPitIndex: number;
}
