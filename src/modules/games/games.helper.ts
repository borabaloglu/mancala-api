import _ from 'lodash';

import gameConfig from '../../shared/configs/game.config';

import { Board } from './interfaces/board.interface';
import { Game } from './interfaces/game.interface';

/**
 * Calculates sum of stones in all pits except mancala
 * @param pits array of numbers that represents number of stones in player's pits
 * @returns number of stones
 */
const calculateSumOfStones = (pits: number[]): number => {
  return pits
    .slice(0, gameConfig.mancalaIndex)
    .reduce(
      (calculatedNumberOfStones, numberOfStonesInCurrentPit) => calculatedNumberOfStones + numberOfStonesInCurrentPit,
      0,
    );
};

/**
 * Collects all stones and put those in mancala
 * @param pits array of numbers that represents number of stones in player's pits
 * @returns updated pits
 */
const collectStonesToMancala = (pits: number[]): number[] => {
  const numberOfStones = calculateSumOfStones(pits);

  const updatedPits = pits.fill(0, 0, gameConfig.mancalaIndex);
  updatedPits[gameConfig.mancalaIndex] += numberOfStones;

  return updatedPits;
};

export default {
  /**
   * Creates a pin by given type
   * @param type
   */
  createPin: (type: 'game' | 'player1' | 'player2'): string => {
    let prefix: string = '';
    switch (type) {
      case 'game': {
        prefix = 'G';
        break;
      }
      case 'player1': {
        prefix = 'P1';
        break;
      }
      case 'player2': {
        prefix = 'P2';
        break;
      }
      default: {
        break;
      }
    }

    return `${prefix}-${_.random(0, 999999).toString().padEnd(6, '0')}`;
  },

  /**
   * Generate default pits for player.
   * @param pits array of numbers that represents number of stones in player's pits
   */
  generateDefaultPits: (): number[] => {
    const pits = new Array(gameConfig.numberOfPits).fill(gameConfig.numberOfStonesPerPit);
    pits.splice(-1, 1, 0); // set number of stones in mancala as 0

    return pits;
  },

  /**
   * Grabs and sows stones in selected pit.
   * @param board
   * @param selectedPitIndex index of selected pit.
   * @returns isPitOfTurnPlayer: is last stone dropped in turn player's pit
   * @returns lastPitIndex: the index of pit which last stone dropped in
   */
  sowStones: (board: Board, selectedPitIndex: number): { isPitOfTurnPlayer: boolean; lastPitIndex: number } => {
    let numberOfStonesInTurnPlayerHand = board.turnPlayerPits[selectedPitIndex];
    board.turnPlayerPits[selectedPitIndex] = 0;

    let currentPitIndex = selectedPitIndex;
    let isPitOfTurnPlayer = true;

    while (numberOfStonesInTurnPlayerHand > 0) {
      // Increments currentPitIndex to go next pit and applies mode operation to keep index between 0-numberOfPits
      currentPitIndex = (currentPitIndex + 1) % gameConfig.numberOfPits;

      // When currentPitIndex = 0, it means you passed to your/other player's pits
      if (currentPitIndex === 0) {
        isPitOfTurnPlayer = !isPitOfTurnPlayer;
      }

      if (isPitOfTurnPlayer) {
        board.turnPlayerPits[currentPitIndex] += 1;
      } else {
        // If you are in opponent player's mancala, don't drop stone and skip
        if (currentPitIndex === gameConfig.mancalaIndex) {
          continue;
        }

        board.opponentPlayerPits[currentPitIndex] += 1;
      }

      numberOfStonesInTurnPlayerHand--;
    }

    return {
      isPitOfTurnPlayer,
      lastPitIndex: currentPitIndex,
    };
  },

  /**
   * Applies empty pit rule.
   * Collects stones in both turn player's last pit and opposite pit of last pit. Puts those stones to turn player's mancala.
   * @param board
   * @param lastPitIndex the index of pit which last stone dropped in
   */
  applyEmptyPitRule: (board: Board, lastPitIndex: number): void => {
    // Substract 1 to skip mancala, subtract lastPitIndex to find opposite index
    const oppositeIndexOfLastPit = gameConfig.mancalaIndex - 1 - lastPitIndex;

    const collectedStones = board.opponentPlayerPits[oppositeIndexOfLastPit] + board.turnPlayerPits[lastPitIndex];

    board.opponentPlayerPits[oppositeIndexOfLastPit] = 0;
    board.turnPlayerPits[lastPitIndex] = 0;

    board.turnPlayerPits[gameConfig.mancalaIndex] += collectedStones;
  },

  /**
   * Checks if player ran out of stones.
   * @param pits array of numbers that represents number of stones in player's pits
   * @returns true if player ran out of stones
   */
  isRanOutOfStones: (pits: number[]): boolean => {
    return calculateSumOfStones(pits) === 0;
  },

  /**
   * Finishes the game and collects all stones in opponent's pits.
   * @param game
   */
  finishGame: (game: Game): void => {
    game.board[game.opponentPlayerPin] = collectStonesToMancala(game.board[game.opponentPlayerPin]);
    game.finishedAt = new Date();
  },

  /**
   * If turn player doesn't win a move, change turn and opponent players.
   * @param game
   */
  setTurnAndOpponentPlayers: (game: Game): void => {
    const turnPlayerPin = game.turnPlayerPin;
    game.turnPlayerPin = game.opponentPlayerPin;
    game.opponentPlayerPin = turnPlayerPin;
  },

  /**
   * Finds winner of the game
   * @param game
   * @returns winner player pin or null if draw
   */
  findWinner: (game: Game): string | null => {
    const numberOfStonesInTurnPlayerMancala = game.board[game.turnPlayerPin][gameConfig.mancalaIndex];
    const numberOfStonesInOpponentPlayerMancala = game.board[game.opponentPlayerPin][gameConfig.mancalaIndex];

    if (numberOfStonesInTurnPlayerMancala > numberOfStonesInOpponentPlayerMancala) {
      return game.turnPlayerPin;
    } else if (numberOfStonesInTurnPlayerMancala < numberOfStonesInOpponentPlayerMancala) {
      return game.opponentPlayerPin;
    } else {
      // Return null in draw situation
      return null;
    }
  },
};
