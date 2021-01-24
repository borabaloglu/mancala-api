import chalk from 'chalk';

import envConfig from './shared/configs/env.config';

import app from './app';

const PORT = envConfig.port;
const HOST = envConfig.isProduction ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`${chalk.bold.green('(✓)')} Server is running on ${HOST}:${PORT}`);
});
