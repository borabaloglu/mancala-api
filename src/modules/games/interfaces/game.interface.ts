import { Document } from 'mongoose';

import { Player } from './player.interface';

export interface Game extends Document {
  pin: string;
  players: {
    [key: string]: Player; // key is player pin
  };
  board: {
    [key: string]: number[]; // key is player pin
  };
  turnPlayerPin: string;
  opponentPlayerPin: string;
  startedAt: Date;
  finishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
