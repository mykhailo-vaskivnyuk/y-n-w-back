
import path from 'node:path';
import fs from 'node:fs';
import { Writable } from 'node:stream';
import Joi from 'joi';
import { TPromiseExecutor } from '../../types/types';
import { IRouterConfig, IRoutes, JoiSchema, THandler } from '../types';
import { isHandler } from '../utils';
import { isJoiSchema } from '../modules.response/validate.response';
import * as tpl from './templates';

export const createClientApi = (config: IRouterConfig, routes: IRoutes) => {
  const executor: TPromiseExecutor<void> = (rv, rj) => {
    const apiPath = config.clientApiPath;
    const apiExt = path.extname(apiPath);
    const apiDir = path.dirname(apiPath)
    const apiFileNameBase = path.basename(apiPath, apiExt);
    const typesFileNameBase = apiFileNameBase + '.types';
    const typesFileName = typesFileNameBase + '.ts';
    const typesPath = path.join(apiDir, typesFileName);
    const apiStream = fs.createWriteStream(apiPath);
    const typesStream = fs.createWriteStream(typesPath);
    let isFinish = false;
    const handleFinish = () => isFinish ? rv() : isFinish = true;
    const handleError = (e: Error) => {
      apiStream.close();
      typesStream.close();
      rj(e);
    }
    apiStream.on('error', handleError);
    apiStream.on('finish', handleFinish);
    typesStream.on('error', handleError);
    typesStream.on('finish', handleFinish);
    const apiTypesPath = path.resolve(config.apiPath, 'types.js');
    const apiTypes = require(apiTypesPath) as Record<string, JoiSchema>;
    Object
      .keys(apiTypes)
      .map((schemaName) => 'I' + schemaName.replace('Schema', ''))
      .forEach((typeName) => apiStream.write(tpl.strImport(typeName)));
    apiStream.write(tpl.strGetApi(typesFileNameBase));
    createJs(apiTypes, apiStream, typesStream)(routes);
    apiStream.write(');\n');
    apiStream.close();
    typesStream.close();
  };
  
  return new Promise(executor);
};

export const createJs = (
  apiTypes: Record<string, JoiSchema>,
  apiStream: Writable,
  typesStream: Writable
) => function createJs(routes: IRoutes, pathname = '', indent = '') {
  apiStream.write('{');
  const nextIndent = indent + '  ';
  const routesKeys = Object.keys(routes);

  for (const key of routesKeys) {
    apiStream.write(tpl.strKey(nextIndent, key));
    const handler = routes[key] as THandler | IRoutes;
    const nextPathname = pathname + '/' + key;

    if (!isHandler(handler)) {
      createJs(handler, nextPathname, nextIndent);
      apiStream.write(',');
      continue;
    }
    
    const typeName = getTypeNameFromPathname(nextPathname);
    const paramsTypeNameExport = typeName;
    const responseTypeNameExport = typeName + 'Response';

    const paramsTypes = getTypes(handler.paramsSchema, nextIndent);
    const paramsTypeName = paramsTypes && 'Types.' + paramsTypeNameExport;
    paramsTypes && typesStream.write(
      tpl.strExport(paramsTypeNameExport, paramsTypes),
    );

    const responseSchema = handler.responseSchema;

    const predefinedResponseSchema = Object.keys(apiTypes)
      .find((key) => apiTypes[key] === responseSchema);
    if (predefinedResponseSchema) {
      const responseTypeName = 'I' + predefinedResponseSchema.replace('Schema', '');
      apiStream.write(
        tpl.strMethod(paramsTypeName, responseTypeName, nextPathname),
      );
      continue;
    }
      
    const responseTypes = getTypes(responseSchema, nextIndent);
    if (!responseTypes) throw new Error(`Handler ${nextPathname} dosn't have response schema`);
    typesStream.write(tpl.strExport(responseTypeNameExport, responseTypes));
    const responseTypeName = 'Types.' + responseTypeNameExport;
    apiStream.write(tpl.strMethod(paramsTypeName, responseTypeName, nextPathname));
  }
  apiStream.write('\n' + indent + '}');
};

const getTypeNameFromPathname = (pathname: string) => {
  return 'T' + pathname
    .replace('/', '')
    .replace(/\./g, '_')
    .split('/')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');
};

const getTypes = (
  schema?: THandler['paramsSchema'] | THandler['responseSchema'],
  indent = ''
): string => {
  if (!schema) return '';
  
  if (isJoiSchema(schema)) {
    let type = schema.type || '';
    if (type === 'object') type = 'Record<string, any>';
    else if (type === 'any') type = getSchemaType(schema);
    return type;
  }

  if (Array.isArray(schema)) {
    return schema
      .map((item) => getTypes(item, indent))
      .join(' | ');
  }

  const schemaEntries = Object.entries(schema);
  const types = schemaEntries
    .map(([key, item]) => tpl.strTypes(indent, key, getTypes(item, indent)));
  return '{' + types.join('') + '\n' + indent + '}';
};

const getSchemaType = (schema: Joi.Schema) => {
  const schemaValuesSet = (schema as any)._valids._values;
  const [type] = [...schemaValuesSet.values()];
  return `${type}`;
};