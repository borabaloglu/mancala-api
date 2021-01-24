import envLoader from 'load-env-var';

export default {
  uri: envLoader.loadString('DATABASE_URI'),
  name: envLoader.loadString('DATABASE_NAME'),
};
