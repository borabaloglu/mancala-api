import { Schema } from 'mongoose';

import connection from '../../../database/connection';

import { Game } from '../interfaces/game.interface';

const GamesSchema = new Schema<Game>({
  pin: {
    type: String,
  },
  players: {
    type: Object,
  },
  board: {
    type: Object,
  },
  turnPlayerPin: {
    type: String,
  },
  opponentPlayerPin: {
    type: String,
  },
  startedAt: {
    type: Date,
  },
  finishedAt: {
    type: Date,
  },
});

export default connection.model<Game>('games', GamesSchema, 'games');
