import * as mongoose from 'mongoose';

import databaseConfig from '../shared/configs/database.config';

export default mongoose.createConnection(databaseConfig.uri, {
  dbName: databaseConfig.name,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
