import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { CRUD, JSON_TRANSFORM_LENGTH, MIME_TYPES_ENUM, MIME_TYPES_MAP } from '../constants';
import { IInputConnection, IOperation, TOperationResponse } from '../app/types';
import { TPromiseExecutor } from '../types';
import { IRequest, IResponse, IServer } from './types';
import { ServerError, ServerErrorEnum, ServerErrorMap } from './errors';

class HttpConnection implements IInputConnection {
  private server: IServer;
  private callback?: (operation: IOperation) => Promise<TOperationResponse>;

  constructor() {
    this.server = createServer(this.onRequest.bind(this));
  }

  onOperation(fn: (operation: IOperation) => Promise<TOperationResponse>) {
    this.callback = fn;
    return this;
  }

  start() {
    if (!this.callback) {
      throw new ServerError(ServerErrorEnum.E_NO_CALLBACK);
    }

    const executor: TPromiseExecutor = (rv, rj) => {
      try {
        this.server.listen(8000, () => rv(null));
      } catch (e: any) {
        logger.error(e);
        rj(new ServerError(ServerErrorEnum.E_LISTEN));
      }
    }

    return new Promise(executor);
  }

  private async onRequest(req: IRequest, res: IResponse) {
    try {
      const operation = await this.getOperation(req);

      const response = await this.callback!(operation);
      if (response instanceof Readable) {
        res.setHeader('content-type', 'application/octet-stream');
        await new Promise((rv, rj) => {
          response.on('error', rj);
          response.on('end', rv);
          response.pipe(res);
        });
        return;
      }

      res.setHeader('content-type', 'application/json');
      const data = JSON.stringify(response);
      res.end(data);

    } catch (e) {
      this.onError(e, res);
    }
  }

  private async getOperation(req: IRequest) {
    const { names, params } = this.getRequestParams(req);
    const data = { params };
    const { headers } = req;
    const contentType = headers['content-type'] as keyof typeof MIME_TYPES_MAP | undefined;
    const length = +(headers['content-length'] || Infinity);

    if (!contentType) return { names, data };

    if (!MIME_TYPES_MAP[contentType]) {
      throw new ServerError(ServerErrorEnum.E_BED_REQUEST);
    } else if (length > MIME_TYPES_MAP[contentType].maxLength) {
      throw new ServerError(ServerErrorEnum.E_BED_REQUEST);
    }
    
    if (contentType === MIME_TYPES_ENUM['application/json'] && length < JSON_TRANSFORM_LENGTH) {
      Object.assign(params, await this.getJson(req));
    } else {
      const content = Readable.from(req);
      const stream = { type: contentType, content };
      Object.assign(data, { stream });  
    }
    
    return { names, data };
  }

  private getRequestParams(req: IRequest) {
    const { method = 'GET', url = '/', headers } = req;
    const host = headers.host;
    const urlObj = new URL(url, `http://${host}`);
    const { pathname, searchParams } = urlObj;
    const names = pathname.slice(1).split('/');
    const crudMethod = CRUD[method?.toLowerCase() as keyof typeof CRUD];
    crudMethod && names.push(crudMethod);
    const queryParams = searchParams.entries();
    const params: IOperation['data']['params'] = {};
    for (const [key, value] of queryParams) params[key] = value;
    return { names, params };
  }

  private async getJson(req: IRequest) {
    try {
      const buffers: Uint8Array[] = [];
      for await (const chunk of req) buffers.push(chunk as any);
      const data = Buffer.concat(buffers).toString();
      return JSON.parse(data);
    } catch (e: any) {
      logger.error(e);
      throw new ServerError(ServerErrorEnum.E_BED_REQUEST);
    }
  }

  private onError(e: any, res: IResponse) {
    logger.error(e);
    switch(e?.code) {
    case ServerErrorEnum.E_NOT_FOUND:
      res.statusCode = 404;
      res.end(ServerErrorMap.E_NOT_FOUND);
      break;
    case ServerErrorEnum.E_BED_REQUEST:
      res.statusCode = 409;
      res.end(ServerErrorMap.E_BED_REQUEST);
      break;
    case ServerErrorEnum.E_UNAVAILABLE:
      res.statusCode = 503;
      res.end(ServerErrorMap.E_UNAVAILABLE);
      break;
    default:
      res.statusCode = 500;
      res.end(ServerErrorMap.E_SERVER_ERROR);
      throw e;
    }
  }

}

export = new HttpConnection();
