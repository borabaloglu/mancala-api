import envLoader from 'load-env-var';

export default {
  port: envLoader.loadNumber('PORT', { defaultValue: 5000 }),

  isProduction: process.env.NODE_ENV === 'production',
};
