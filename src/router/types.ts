import { ObjectSchema } from 'joi';
import { IOperation, IParams, TOperationResponse } from '../app/types';
import { TMail } from '../services/mail/mail';
import { Session } from '../services/session/session';

export type THandler<T extends IParams = IParams> = {
  (context: IContext, params: T): Promise<TOperationResponse>;
  schema?: ObjectSchema<T>;
};

export interface IRoutes {
  [key: string]: THandler | IRoutes;
}

export interface IServices {
  session: Session<ISessionContent>;
  sendMail: TMail;
}

export type ServicesEnum = keyof IServices;

export type IContext = IServices;

export type TModule<T = any> = (config: T) =>
  (context: IContext, data: IOperation['data'], handler?: THandler) =>
    Promise<[IContext, IOperation['data'] & { params: IParams & Record<string, unknown> }]>;

export type ISessionContent = Partial<{
  userId: number;
}>;