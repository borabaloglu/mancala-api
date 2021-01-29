import * as validator from 'class-validator';

import _ from 'lodash';

import { Request, Response, Router } from 'express';

import gameConfig from '../../shared/configs/game.config';
import playerAuth from '../../shared/middlewares/player-auth.middleware';
import safeThrow from '../../shared/middlewares/safe-throw.middleware';
import validationMiddleware from '../../shared/middlewares/validation.middleware';

import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

import gamesService from './games.service';
import gamesHelper from './games.helper';

const router = Router();

/**
 * (GET) /configs -> Get game configs
 */
router.get('/configs', (req, res) => {
  res.send(gameConfig);
});

/**
 * (POST) / -> Create new game
 */
router.post(
  '/',
  validationMiddleware(CreateGameDto),
  safeThrow(async (req: Request, res: Response) => {
    const result = await gamesService.create(req.body);
    res.send(result);
  }),
);

/**
 * (POST) /:gamePin/join -> Join game
 */
router.post(
  '/:gamePin/join',
  validationMiddleware(JoinGameDto),
  safeThrow(async (req: Request, res: Response) => {
    req.body.gamePin = req.params.gamePin;

    const result = await gamesService.join(req.body);
    res.send(result);
  }),
);

/**
 * (PATCH) /:gamePin/make-move -> Make move if player's turn
 */
router.patch(
  '/:gamePin/make-move',
  validationMiddleware(MakeMoveDto),
  playerAuth(),
  safeThrow(async (req: Request, res: Response) => {
    const updatedGame = await gamesService.makeMove(req.body, req.body.game);

    if (validator.isDefined(updatedGame.finishedAt)) {
      const winnerPin = gamesHelper.findWinner(updatedGame);
      res.send({
        game: updatedGame,
        winnerPin,
      });
    } else {
      res.send({
        board: _.values(updatedGame.board),
        wonAnotherMove: req.body.game.turnPlayerPin === req.body.playerPin,
      });
    }
  }),
);

export default router;
