import dayjs from 'dayjs';
import pino from 'pino';
import logger from 'pino-http';

import envConfig from '../configs/env.config';

export default logger(
  {
    level: envConfig.isProduction ? 'error' : 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    prettyPrint: envConfig.isProduction ? false : { translateTime: true, levelFirst: true },
  },
  envConfig.isProduction ? pino.destination(`logs/${dayjs().format('YYYY-MM-DD-HH:mm:ss')}_${process.pid}.log`) : null,
);
