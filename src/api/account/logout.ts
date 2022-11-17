import Joi from 'joi';
import { THandler } from '../../router/types';

const logout: THandler<any, boolean> = async (context) => {
  await context.session.clear();
  return true;
};
logout.responseSchema = Joi.boolean();
logout.allowedForUser = 'NOT_LOGGEDIN';

export = logout;
