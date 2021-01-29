import * as validator from 'class-validator';

import _ from 'lodash';

import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../errors/app.error';
import { NotTurnPlayerError } from '../errors/game.error';

import gamesService from '../../modules/games/games.service';

/**
 * Authenticates player if he/she can play in given game and game's current round
 */
export default () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const game = await gamesService.findOneByPin(req.params.gamePin);
      const playerPin = req.headers['x-player-pin'];

      if (!validator.isDefined(playerPin) || !_.has(game.players, playerPin)) {
        throw new UnauthorizedError();
      }

      if (game.turnPlayerPin !== playerPin) {
        throw new NotTurnPlayerError();
      }

      req.body.game = game;
      req.body.playerPin = playerPin;

      next();
    } catch (error) {
      next(error);
    }
  };
};
