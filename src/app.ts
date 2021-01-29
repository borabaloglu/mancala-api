import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env' : '.dev.env',
});

import express from 'express';

import gamesController from './modules/games/games.controller';

import globalExceptionFilter from './shared/exception-filters/global.exception-filter';
import notFoundExceptionFilter from './shared/exception-filters/not-found.exception-filter';
import appLogger from './shared/loggers/app.logger';

const app = express();

app.use(appLogger);

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());

app.use('/games', gamesController);

app.use(notFoundExceptionFilter);
app.use(globalExceptionFilter);

export default app;
