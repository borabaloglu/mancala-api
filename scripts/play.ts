import * as validator from 'class-validator';

import axios, { AxiosInstance } from 'axios';
import chalk from 'chalk';
import columnify from 'columnify';
import dotenv from 'dotenv';
import envLoader from 'load-env-var';
import _ from 'lodash';
import readline from 'readline';

import { promisify } from 'util';

import gamesHelper from '../src/modules/games/games.helper';

dotenv.config({ path: '.play.env' });

// Define types
type PlayerId = 1 | 2;

// Define interfaces
interface Player {
  id: PlayerId;
  pin: string;
  http: AxiosInstance;
}

interface GameConfig {
  numberOfPits?: number;
  mancalaIndex?: number;
  numberOfStonesPerPit?: number;
}

interface GameEnvironment {
  gamePin?: string;
  turnPlayerPin?: string;
  turnPlayerId?: PlayerId;
  players?: {
    [key: string]: Player;
  };
  board?: number[][];
  configs?: GameConfig;
}

// Define constants
const BASE_URL = envLoader.loadString('BASE_URL', { defaultValue: 'http://localhost:5000' });
const P1_ID: PlayerId = 1;
const P2_ID: PlayerId = 2;

// Make readline function async
readline.Interface.prototype.question[promisify.custom] = function (prompt: any) {
  return new Promise((resolve) => readline.Interface.prototype.question.call(this, prompt, resolve));
};
// @ts-ignore
readline.Interface.prototype.questionAsync = promisify(readline.Interface.prototype.question);

// This will be used to read user input
const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Sleep in given duration
 * @param ms waiting duration in ms
 */
const wait = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

/**
 * Displays current board
 * @param gameEnvironment
 * @param selectedPitIndex
 */
const displayBoard = (gameEnvironment: GameEnvironment, selectedPitIndex?: number): void => {
  const board = gameEnvironment.board;

  // Colorize player1 pits
  const player1Pits = board[0].map((numberOfStonesInCurrentPit, currentPitIndex) => {
    // Mark red if pit is mancala
    if (currentPitIndex === gameEnvironment.configs.mancalaIndex) {
      return chalk.bold.red(numberOfStonesInCurrentPit);
    }

    return chalk.green(numberOfStonesInCurrentPit);
  });
  player1Pits.splice(0, 0, '');

  // Colorize player1 pit instructions
  const player1PitInstructions = ['', ..._.range(0, gameEnvironment.configs.mancalaIndex), 'M'].map(
    (numberOfStonesInCurrentPit, currentPitIndex) => {
      // Mark dimmed if player 1 is who made the move and selected pit index is current index
      if (
        validator.isDefined(selectedPitIndex) &&
        gameEnvironment.turnPlayerId === P1_ID &&
        currentPitIndex === selectedPitIndex + 1
      ) {
        return chalk.dim(`[${numberOfStonesInCurrentPit}]`);
      }

      return chalk.gray(numberOfStonesInCurrentPit);
    },
  );

  // Colorize player2 pits
  const player2Pits = board[1].map((numberOfStonesInCurrentPit, currentPitIndex) => {
    if (currentPitIndex === gameEnvironment.configs.mancalaIndex) {
      return chalk.bold.red(numberOfStonesInCurrentPit);
    }

    return chalk.blue(numberOfStonesInCurrentPit);
  });
  player2Pits.reverse();
  player2Pits.push('');

  // Colorize player2 pit instructions
  const player2PitInstructions = ['M', ..._.rangeRight(0, gameEnvironment.configs.mancalaIndex), ''].map(
    (numberOfStonesInCurrentPit, currentPitIndex) => {
      // Mark dimmed if player 2 is who made the move and selected pit index is current index
      if (
        validator.isDefined(selectedPitIndex) &&
        gameEnvironment.turnPlayerId === P2_ID &&
        currentPitIndex === gameEnvironment.configs.numberOfPits - 1 - selectedPitIndex &&
        numberOfStonesInCurrentPit !== ''
      ) {
        return chalk.dim(`[${numberOfStonesInCurrentPit}]`);
      }

      return chalk.gray(numberOfStonesInCurrentPit);
    },
  );

  // Display board
  console.log(
    `${columnify([player2PitInstructions, player2Pits, player1Pits, player1PitInstructions], {
      showHeaders: false,
      align: 'center',
      minWidth: 3,
    })}\n`,
  );
};

/**
 * Extracts selectable pit indexes by turn player id
 * @param gameEnvironment
 * @returns selectable pit indexes
 */
const extractSelectablePitIndexes = (gameEnvironment: GameEnvironment): number[] => {
  return gameEnvironment.board[gameEnvironment.turnPlayerId - 1]
    .slice(0, 6)
    .map((numberOfStonesInCurrentPit, currentPitIndex) => (numberOfStonesInCurrentPit !== 0 ? currentPitIndex : -1))
    .filter((numberOfStonesInCurrentPit) => numberOfStonesInCurrentPit !== -1);
};

/**
 * Sends get game configs request to server
 * @returns game configs
 */
const getGameConfigs = async (): Promise<GameConfig> => {
  const response = await axios.request({
    url: `${BASE_URL}/games/configs`,
    method: 'GET',
  });

  return response.data;
};

/**
 * Sends create game request to server
 * @returns gamePin
 * @returns turnPlayerPin
 */
const createGame = async (): Promise<{ gamePin: string; turnPlayerPin: string }> => {
  const response = await axios.request({
    url: `${BASE_URL}/games`,
    method: 'POST',
    data: { playerName: 'Player 1' },
  });

  return {
    gamePin: response.data.gamePin,
    turnPlayerPin: response.data.turnPlayerPin,
  };
};

/**
 * Sends join game request to server
 * @param gamePin
 * @returns opponentPlayerPin
 */
const joinGame = async (gamePin: string): Promise<{ opponentPlayerPin: string }> => {
  const response = await axios.request({
    url: `${BASE_URL}/games/${gamePin}/join`,
    method: 'POST',
    data: { playerName: 'Player 2' },
  });

  return {
    opponentPlayerPin: response.data.opponentPlayerPin,
  };
};

const quitGame = async (gameEnvironment: GameEnvironment): Promise<void> => {
  await axios.request({
    url: `${BASE_URL}/games/${gameEnvironment.gamePin}`,
    method: 'DELETE',
    headers: {
      'x-player-pin': gameEnvironment.turnPlayerPin,
    },
  });

  process.exit(0);
};

/**
 * Creates a custom axios instances for player
 * @param gamePin
 * @param playerPin
 */
const createPlayerHttpInstance = (gamePin: string, playerPin: string): AxiosInstance => {
  return axios.create({
    baseURL: `${BASE_URL}/games/${gamePin}/make-move`,
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-player-pin': playerPin,
    },
  });
};

/**
 * Setups game
 * @returns game environment
 */
const setupGame = async (): Promise<GameEnvironment> => {
  const gameConfigs = await getGameConfigs();

  const gameEnvironment: GameEnvironment = {
    configs: gameConfigs,
  };

  const createGameResponse = await createGame();
  gameEnvironment.gamePin = createGameResponse.gamePin;

  const joinGameResponse = await joinGame(gameEnvironment.gamePin);

  gameEnvironment.players = {
    [createGameResponse.turnPlayerPin]: {
      id: P1_ID,
      pin: createGameResponse.turnPlayerPin,
      http: createPlayerHttpInstance(gameEnvironment.gamePin, createGameResponse.turnPlayerPin),
    },
    [joinGameResponse.opponentPlayerPin]: {
      id: P2_ID,
      pin: joinGameResponse.opponentPlayerPin,
      http: createPlayerHttpInstance(gameEnvironment.gamePin, joinGameResponse.opponentPlayerPin),
    },
  };

  gameEnvironment.turnPlayerPin = createGameResponse.turnPlayerPin;
  gameEnvironment.turnPlayerId = P1_ID;

  gameEnvironment.board = [gamesHelper.generateDefaultPits(), gamesHelper.generateDefaultPits()];

  return gameEnvironment;
};

/**
 * Display a question prompt to make user select a pit
 * @param selectablePitIndexes
 * @returns selected pit index
 */
const displayUserPitSelectionPrompt = async (
  selectablePitIndexes: number[],
  gameEnvironment: GameEnvironment,
): Promise<number> => {
  let userInput: string;
  let selectedPitIndex: number;

  while (!validator.isDefined(selectedPitIndex)) {
    // @ts-ignore
    userInput = await cli.questionAsync('Select a pit (0-5), (q to quit): ');

    console.log(); // Log empty line

    if (userInput.toLowerCase() === 'q') {
      await quitGame(gameEnvironment);
    }

    selectedPitIndex = +userInput;

    if (!validator.isInt(selectedPitIndex) || !selectablePitIndexes.includes(selectedPitIndex)) {
      console.log(
        chalk.bold.yellow(
          `🚧 Please select a pit has stones except mancala! (Selectable: ${selectablePitIndexes.join(',')})\n`,
        ),
      );

      selectedPitIndex = null;
    }
  }

  return selectedPitIndex;
};

/**
 * Selects pit for current round
 * @param gameEnvironment
 * @returns selected pit index
 */
const selectPit = async (gameEnvironment: GameEnvironment): Promise<number> => {
  const selectablePitIndexes = extractSelectablePitIndexes(gameEnvironment);

  let selectedPitIndex: number;

  if (gameEnvironment.turnPlayerId === P1_ID) {
    selectedPitIndex = await displayUserPitSelectionPrompt(selectablePitIndexes, gameEnvironment);
  } else {
    console.log(chalk.bold.blue(`🤔 Hmm... Your opponent is thinking!\n`));
    await wait(1500);

    // Pick random index for game bot
    selectedPitIndex = _.sample(selectablePitIndexes);
  }

  console.log(`PLAYER${gameEnvironment.turnPlayerId} selected ${chalk.bold.cyan(selectedPitIndex)}.\n`);

  return selectedPitIndex;
};

/**
 * Gets opponent player pin
 * @param turnPlayerPin
 * @param players
 * @returns opponent player pin
 */
const getOpponentPlayerPin = (turnPlayerPin: string, players: Record<string, Player>): string => {
  return _(players).keys().pull(turnPlayerPin).value()[0];
};

/**
 * Makes move
 * @param gameEnvironment
 * @param selectedPitIndex
 */
const makeMove = async (gameEnvironment: GameEnvironment, selectedPitIndex: number): Promise<void> => {
  const turnPlayer = gameEnvironment.players[gameEnvironment.turnPlayerPin];

  const response = (await turnPlayer.http.request({ data: { selectedPitIndex } })).data;

  // If game is finished
  if (validator.isDefined(response.game)) {
    gameEnvironment.board = _.values(response.game.board);

    displayBoard(gameEnvironment, selectedPitIndex);

    if (validator.isDefined(response.winnerPin)) {
      const winnerPlayer = gameEnvironment.players[response.winnerPin];
      switch (winnerPlayer.id) {
        case P1_ID: {
          console.log(chalk.bold.green(`🏆 You won`));
          break;
        }
        case P2_ID: {
          console.log(chalk.bold.red(`😔 You lose`));
          break;
        }
        default: {
          break;
        }
      }
    } else {
      console.log(chalk.bold.red(`🤝 Draw`));
    }

    process.exit();
  }

  gameEnvironment.board = response.board;

  displayBoard(gameEnvironment, selectedPitIndex);

  // Set turn player
  if (!response.wonAnotherMove) {
    gameEnvironment.turnPlayerPin = getOpponentPlayerPin(turnPlayer.pin, gameEnvironment.players);
    gameEnvironment.turnPlayerId = gameEnvironment.players[gameEnvironment.turnPlayerPin].id;
  } else {
    if (turnPlayer.id === P1_ID) {
      console.log(chalk.bold.green(`🥳 You won another turn!\n`));
    } else {
      console.log(chalk.bold.green(`😔 Your opponent won another turn!\n`));
    }
  }
};

/**
 * Main function
 */
const bootstrap = async () => {
  // Setup game
  const gameEnvironment = await setupGame();

  displayBoard(gameEnvironment);

  // Start game
  while (true) {
    const selectedPitIndex = await selectPit(gameEnvironment);

    try {
      await makeMove(gameEnvironment, selectedPitIndex);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
};

bootstrap();
