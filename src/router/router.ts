import fs from 'node:fs';
import path from 'node:path';
import { Writable } from 'node:stream';
import Joi from 'joi';
import { getEnumFromMap } from '../utils/utils';
import { THandler, IRoutes, TModule, IContext } from './types';
import { TPromiseExecutor } from '../types';
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
      const { apiPath } = this.config;
      this.routes = await this.createRoutes(apiPath);
      await this.createClientApi();
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
    const dir = await fs.promises.opendir(routePath);
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

  private createClientApi() {
    if (!this.routes) throw new RouterError(RouterErrorEnum.E_ROUTES);
    const executor: TPromiseExecutor<void> = (rv, rj) => {
      const stream = fs.createWriteStream(this.config.clientApiPath);
      stream.on('error', rj);
      stream.on('finish', rv);
      stream.write(`
export const api = (
  fetch: (pathname: string, options: Record<string, any>) => Promise<any>
) => (`);
      this.createJs(this.routes!, stream);
      stream.write(');\n');
      stream.close();
    };

    return new Promise(executor);
  }

  private createJs(routes: IRoutes, stream: Writable, pathname = '', indent = '') {
    stream.write('{');
    const nextIndent = indent + '  ';
    const routesKeys = Object.keys(routes);
    for (const key of routesKeys) {
      stream.write(`\n${nextIndent}'${key}': `);
      const handler = routes[key] as THandler | IRoutes;
      const nextPathname = pathname + '/' + key;
      if (this.isHandler(handler)) {
        const types = this.getTypes(handler.params, nextIndent);
        stream.write(
          `(options: ${types}) => fetch('${nextPathname}', options),`
        );
      }
      else {
        this.createJs(handler, stream, nextPathname, nextIndent);
        stream.write(',');
      }
    }
    stream.write('\n' + indent + '}');
  }

  private getTypes(params?: Record<string, Joi.Schema>, indent = '') {
    if (!params) return 'Record<string, any>';
    const result = [];
    const paramsEntries = Object.entries(params)
    for (const [key, { type }] of paramsEntries) {
      result.push(`\n${indent}  ${key}: ${type},`);
    }
    return `{${result.join('')}\n${indent}}`;
  }
}

export default Router;
