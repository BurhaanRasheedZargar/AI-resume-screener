const pino = require('pino');
const env = require('./env');

const logger = pino(
    env.NODE_ENV === 'production'
        ? { level: 'info' }
        : {
              level: env.NODE_ENV === 'test' ? 'silent' : 'debug',
              transport: {
                  target: 'pino-pretty',
                  options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
              },
          }
);

module.exports = logger;
