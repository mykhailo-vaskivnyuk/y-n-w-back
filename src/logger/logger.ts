import { format } from 'util';
import pino = require('pino');
import { ILogger, TLoggerParameters } from '../app/types';
import { ILoggerConfig, LOGGER_TARGET } from './types';

class Logger implements ILogger {
  private logger;

  constructor(config: ILoggerConfig) {
    const { level, target } = config;
    const toConsole = { target: 'pino-pretty', level, options: {} };
    const toStdOut = { target: 'pino/file', level, options: { destination: 1 } };
    const transport =  target === LOGGER_TARGET.STDOUT ? toStdOut : toConsole;
    const options = { level, transport };
    this.logger = pino.default(options);
  }

  fatal<T>(obj: T, ...message: TLoggerParameters) {
    this.logger.fatal(obj, format(...message))
  }

  error<T>(obj: T, ...message: TLoggerParameters) {
    this.logger.error(obj, format(...message))
  }

  warn<T>(obj: T, ...message: TLoggerParameters) {
    this.logger.warn(obj, format(...message))
  }

  info<T>(obj: T, ...message: TLoggerParameters) {
    this.logger.info(obj, format(...message))
  }

  debug<T>(obj: T, ...message: TLoggerParameters) {
    this.logger.debug(obj, format(...message))
  }
}

export default Logger;