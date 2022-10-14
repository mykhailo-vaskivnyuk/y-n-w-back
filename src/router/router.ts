import fsp from 'node:fs/promises';
import path from 'node:path';
import { getEnumFromMap } from '../utils/utils';
import { THandler, IRoutes, TModule, IContext } from './types';
import { IRouter, IOperation, TOperationResponse, IRouterConfig } from '../app/types';
import { RouterError, RouterErrorEnum } from './errors';
import { DatabaseError } from '../db/errors';
import { getStream, GetStreamError } from './modules/get.stream';
import { validate, ValidationError } from './modules/validate';
import { SessionError, setSession } from './modules/set.session';
import { setMail } from './modules/send.mail';

export const MODULES = {
  getStream,
  validate,
  setSession,
  setMail,
};

export const MODULES_ENUM = getEnumFromMap(MODULES);

class Router implements IRouter {
  private config: IRouterConfig;
  private routes?: IRoutes;
  private modules: ReturnType<TModule>[] = [];

  constructor(config: IRouterConfig) {
    this.config = config;

  }

  async init() {
    try {
      const { modules, modulesConfig } = this.config;
      modules.map(
        (module) => {
          const moduleConfig = modulesConfig[module] as any;
          this.modules.push(MODULES[module](moduleConfig));
        });
    } catch (e: any) {
      logger.error(e);
      throw new RouterError(RouterErrorEnum.E_MODULE);
    }

    try {
      this.routes = await this.createRoutes(this.config.apiPath);
    } catch (e: any) {
      logger.error(e);
      throw new RouterError(RouterErrorEnum.E_ROUTES);
    }
  }
  
  async exec(operation: IOperation): Promise<TOperationResponse> {
    const { names, data: inputData } = operation;
    const inputContext = {} as IContext;

    const handler = this.findRoute(names);
    const [context, data] = await this.runModules(inputContext, inputData, handler);

    try {
      return await handler(context, data.params);
    } catch (e: any) {
      if (!(e instanceof DatabaseError)) logger.error(e);
      throw new RouterError(RouterErrorEnum.E_HANDLER, e.message);
    }
  }

  private async createRoutes(dirPath: string): Promise<IRoutes> {
    const route: IRoutes = {};
    const routePath = path.resolve(dirPath);
    const dir = await fsp.opendir(routePath);
    for await (const item of dir) {
      const ext = path.extname(item.name);
      const name = path.basename(item.name, ext);
      if (item.isFile()) {
        if (ext !== '.js') continue;
        const filePath = path.join(routePath, name);
        const moduleExport = require(filePath) as THandler | IRoutes;
        if (name === 'index') {
          if (typeof moduleExport === 'function')
            throw new Error(`Wrong api module: ${filePath}`);
          Object.assign(route, moduleExport);
        } else route[name] = moduleExport;
      } else {
        const dirPath = path.join(routePath, name);
        route[name] = await this.createRoutes(dirPath);
      }
    }
    return route;
  }

  private findRoute(names: IOperation['names']): THandler {
    if (!this.routes) throw new RouterError(RouterErrorEnum.E_ROUTES);
    let handler: IRoutes | THandler = this.routes;
    for (const key of names) {
      if (this.isHandler(handler)) throw new RouterError(RouterErrorEnum.E_NO_ROUTE);
      if (!handler[key]) throw new RouterError(RouterErrorEnum.E_NO_ROUTE);
      handler = handler[key]!;
    }
    if (!this.isHandler(handler)) throw new RouterError(RouterErrorEnum.E_NO_ROUTE);
    return handler;
  }

  private isHandler(handler?: IRoutes | THandler): handler is THandler {
    return typeof handler === 'function';
  }

  private async runModules(
    context: IContext, data: IOperation['data'], handler: THandler
  ): Promise<[IContext, IOperation['data']]> {
    try {
      for (const module of this.modules)
        [context, data] = await module(context, data, handler);
    } catch (e: any) {
      const { message, details } = e;
      if (e instanceof SessionError)
        throw new RouterError(RouterErrorEnum.E_ROUTER, message);
      if (e instanceof ValidationError)
        throw new RouterError(RouterErrorEnum.E_MODULE, details);
      if (e instanceof GetStreamError)
        throw new RouterError(RouterErrorEnum.E_MODULE, message);
      logger.error(e);
      throw new RouterError(RouterErrorEnum.E_ROUTER, details || message);
    }
    return [context, data];
  }
}

export default Router;