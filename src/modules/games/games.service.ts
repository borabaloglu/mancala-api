import * as validator from 'class-validator';

import gameConfig from '../../shared/configs/game.config';

import { DatabaseActionError, MissingRecordError } from '../../shared/errors/database.error';

import gamesHelper from './games.helper';
import gameModel from './models/game.model';

import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

import { Game } from './interfaces/game.interface';

export default {
  /**
   * Finds game record by pin
   * @param gamePin
   */
  findOneByPin: async (gamePin: string): Promise<Game> => {
    const game = await gameModel.findOne({ pin: gamePin });

    if (!validator.isDefined(game)) {
      throw new MissingRecordError({ gamePin });
    }

    return game;
  },

  /**
   * Creates a new game.
   * @param dto
   */
  create: async (dto: CreateGameDto): Promise<{ gamePin: string; turnPlayerPin: string }> => {
    try {
      const gamePin = gamesHelper.createPin('game');

      // The player who creates the game is automatically become turn player
      const turnPlayerPin = gamesHelper.createPin('player1');
      const turnPlayerPits = gamesHelper.generateDefaultPits();

      await gameModel.create({
        pin: gamePin,
        players: {
          [turnPlayerPin]: {
            name: dto.playerName,
            pin: turnPlayerPin,
          },
        },
        board: {
          [turnPlayerPin]: turnPlayerPits,
        },
        turnPlayerPin,
      });

      return {
        gamePin,
        turnPlayerPin,
      };
    } catch (error) {
      throw new DatabaseActionError();
    }
  },

  /**
   * Joins player to game.
   * @param dto
   */
  join: async (dto: JoinGameDto): Promise<{ opponentPlayerPin: string }> => {
    const game = await gameModel.findOne({ pin: dto.gamePin });

    // Player can't join if game does not exist or game is already started
    if (!validator.isDefined(game) || validator.isDefined(game.startedAt)) {
      throw new MissingRecordError({ gamePin: dto.gamePin });
    }

    const opponentPlayerPin = gamesHelper.createPin('player2');
    const opponentPlayerPits = gamesHelper.generateDefaultPits();

    game.opponentPlayerPin = opponentPlayerPin;
    game.players[opponentPlayerPin] = {
      name: dto.playerName,
      pin: opponentPlayerPin,
    };
    game.board[opponentPlayerPin] = opponentPlayerPits;
    game.startedAt = new Date();

    // Mark modified nested objects unless mongo does not save those fields
    game.markModified('players');
    game.markModified('board');

    try {
      await game.save();

      return { opponentPlayerPin };
    } catch (error) {
      throw new DatabaseActionError();
    }
  },

  /**
   * Makes a move.
   * @param dto
   * @param game
   * @returns updated game record
   */
  makeMove: async (dto: MakeMoveDto, game: Game): Promise<Game> => {
    const board = {
      turnPlayerPits: game.board[game.turnPlayerPin],
      opponentPlayerPits: game.board[game.opponentPlayerPin],
    };

    const { isPitOfTurnPlayer, lastPitIndex } = gamesHelper.sowStones(board, dto.selectedPitIndex);

    if (isPitOfTurnPlayer && lastPitIndex !== gameConfig.mancalaIndex && board.turnPlayerPits[lastPitIndex] === 1) {
      gamesHelper.applyEmptyPitRule(board, lastPitIndex);
    }

    // Update game board
    game.board[game.turnPlayerPin] = board.turnPlayerPits;
    game.board[game.opponentPlayerPin] = board.opponentPlayerPits;

    let isFinished = false;
    if (gamesHelper.isRanOutOfStones(game.board[game.turnPlayerPin])) {
      gamesHelper.finishGame(game);
      isFinished = true;
    }

    if (!isFinished && (!isPitOfTurnPlayer || lastPitIndex !== gameConfig.mancalaIndex)) {
      gamesHelper.setTurnAndOpponentPlayers(game);
    }

    game.markModified('board');

    try {
      await game.save();

      return game;
    } catch (error) {
      throw new DatabaseActionError();
    }
  },
};
