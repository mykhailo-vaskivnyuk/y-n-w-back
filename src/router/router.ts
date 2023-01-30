/* eslint-disable max-lines */
import { setTimeout, setInterval } from 'node:timers';
import {
  THandler, IRoutes, TInputModule, IContext,
  TOutputModule, IRouter, IRouterConfig, ITask,
} from './types';
import { IOperation, TOperationResponse } from '../types/operation.types';
import { RouterError } from './errors';
import { isHandler } from './utils';
import { errorHandler } from './methods/error.handler';
import { createClientApi } from './methods/create.client.api';
import {
  applyInputModules, applyOutputModules,
  getExecInputModules, getExecOutputModules,
} from './methods/modules';
import { getServices } from './methods/services';
import { createRoutes } from './methods/create.routes';

class Router implements IRouter {
  private config: IRouterConfig;
  private routes?: IRoutes;
  private modules: ReturnType<TInputModule>[] = [];
  private responseModules: ReturnType<TOutputModule>[] = [];

  constructor(config: IRouterConfig) {
    this.config = config;
  }

  async init() {
    try {
      const services = getServices(this.config);
      Object.assign(globalThis, services);
    } catch (e: any) {
      logger.error(e);
      throw new RouterError('SERVICE_ERROR');
    }

    try {
      this.modules = applyInputModules(this.config);
      this.responseModules = applyOutputModules(this.config);
    } catch (e: any) {
      logger.error(e);
      throw new RouterError('MODULE_ERROR');
    }

    try {
      const { apiPath } = this.config;
      this.routes = await createRoutes(apiPath);
      await createClientApi(this.config, this.routes);
    } catch (e: any) {
      logger.error(e);
      throw new RouterError('ROUTES_CREATE_ERROR');
    }

    try {
      const { tasks = [] } = this.config;
      for (const task of tasks) await this.execTask(task);
    } catch (e: any) {
      logger.error(e);
      throw new RouterError('TASK_ERROR');
    }

    return this;
  }

  async exec(operation: IOperation): Promise<TOperationResponse> {
    if (!this.routes) throw new RouterError('ROUTES_CREATE_ERROR');
    const { options: { origin, connectionId }, names } = operation;
    const context = { origin, connectionId } as IContext;
    const handler = this.findRoute(names);
    const execInputModules = getExecInputModules(this.modules);
    const execOutputModules = getExecOutputModules(this.responseModules);

    try {
      const { data } = await execInputModules(operation, context, handler);
      const { params } = data;
      const response = await handler(context, params);
      return await execOutputModules(response, context, handler);
    } catch (e: any) {
      return errorHandler(e);
    } finally {
      await context.session.finalize();
    }
  }

  private async execTask(task: ITask) {
    const { time = null, interval = 0, params, names } = task;
    const context = { isAdmin: true } as IContext;
    const handler = this.findRoute(names);
    if (time === null) {
      if (!interval) return await handler(context, params);
      setInterval(() => handler(context, params)
        .catch((e) => logger.error(e)), interval);
      return;
    }
    setTimeout(() => {
      handler(context, params).catch((e) => logger.error(e));
      if (!interval) return;
      setInterval(() => handler(context, params)
        .catch((e) => logger.error(e)), interval);
    }, time);
  }

  private findRoute(names: IOperation['names']): THandler {
    let handler: IRoutes | THandler = this.routes!;
    for (const key of names) {
      if (!isHandler(handler) && key in handler) handler = handler[key]!;
      else throw new RouterError('CANT_FIND_ROUTE');
    }
    if (isHandler(handler)) return handler;
    throw new RouterError('CANT_FIND_ROUTE');
  }
}

export = Router;
