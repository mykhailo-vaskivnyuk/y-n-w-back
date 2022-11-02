import Database from '../db/db';
import {
  IConfig,
  ILogger, LoggerClass,
  IDatabase, DatabaseConnectionClass,
  IRouter, RouterClass,
  IInputConnection, InputConnectionClass,
} from './types';
import { AppError, AppErrorEnum } from './errors';
import { DatabaseError } from '../db/errors';
import { RouterError, RouterErrorEnum } from '../router/errors';
import { ServerError, ServerErrorEnum } from '../server/errors';
import { IDatabaseQueries } from '../db/types';

class App {
  private config: IConfig;
  private logger?: ILogger;
  private db?: IDatabase;
  private router?: IRouter;
  private inConnection?: IInputConnection;

  constructor(config: IConfig) {
    this.config = config;
    this.setErrorHandlers();
  }
  
  setLogger(Logger: LoggerClass) {
    this.logger = new Logger(this.config.logger);
    return this;
  }
  
  setDatabase(Connection: DatabaseConnectionClass) {
    this.db = new Database(this.config.database);
    this.db.setConnection(Connection);
    return this;
  }
  
  setRouter(Router: RouterClass) {
    this.router = new Router(this.config.router);
    return this;
  }

  setInputConnection(InConnection: InputConnectionClass) {
    this.inConnection = new InConnection(this.config.inConnection);
    this.inConnection.onOperation(async (operation) => {
      try {
        return await this.router!.exec(operation);
      } catch (e: any) {
        const { code, message, details } = e;
        const errors = {
          [RouterErrorEnum.E_NO_ROUTE]: () => {
            throw new ServerError(ServerErrorEnum.E_NOT_FOUND, details) },
          [RouterErrorEnum.E_MODULE]: () => {
            throw new ServerError(ServerErrorEnum.E_BED_REQUEST, details) },
          [RouterErrorEnum.E_REDIRECT]: () => {
            throw new ServerError(ServerErrorEnum.E_REDIRECT, details) },
        };
        if (e instanceof RouterError && code in errors) errors[code]!();
        else logger.error(e);
        throw new AppError(AppErrorEnum.E_ROUTER, message);
      }
    });
    return this;
  }

  async start() {
    try {
      Object.assign(global, { logger: this.logger });
      logger.info('LOGGER IS READY');

      const execQuery = await this.db!.init() as IDatabaseQueries;
      // Object.assign(global, { execQuery });
      logger.info('DATABASE IS READY');

      await this.router!.init({ execQuery });
      logger.info('ROUTER IS READY');

      await this.inConnection!.start();
      logger.info('SERVER IS READY');

    } catch (e) {
      const isKnown =
        e instanceof DatabaseError ||
        e instanceof RouterError ||
        e instanceof ServerError;
      if (!isKnown) logger.error(e);
      throw new AppError(AppErrorEnum.E_START);
    }
  }

  private setErrorHandlers() {
    const uncaughtErrorHandler = (e: any) => {
      typeof logger !== 'undefined' ? logger.fatal(e) : console.error(e);
      process.nextTick(() => process.exit());
    }

    process.on('unhandledRejection', uncaughtErrorHandler);
    process.on('uncaughtException', uncaughtErrorHandler);
  }
}

export = App;
