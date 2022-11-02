import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { IModulesContext } from '../app/types';
import { customRequire } from './custom.require';
import { TMode, TRequire } from './types';
import { log, resolve } from './utils';

export const loadModule = (
  modulePath: string,
  modulesContext?: IModulesContext,
  mode: TMode = false
) => {
  const parentModuleDir = require.main!.path;
  return loader(modulePath, parentModuleDir, modulesContext, mode);
}

const loader = (
  modulePath: string,
  parentModuleDir: string,
  modulesContext?: IModulesContext,
  mode: TMode = false,
) => {
  const moduleFullPath = resolve(parentModuleDir, modulePath);
  if (!moduleFullPath) return require(modulePath);
  log(moduleFullPath);
  const moduleFullDir = path.dirname(moduleFullPath);
  const script = fs.readFileSync(moduleFullPath).toString();
  const module = { exports: {} };
  let newRequire;
  const context = {
    require: null as unknown as TRequire,
    console,
    module,
    exports: module.exports,
    __filename: moduleFullPath,
    __dirname: moduleFullDir,
    logger,
    ...modulesContext,
  };
  if (mode === 'isolate_all') {
    newRequire = ((modulePath: string) =>
      loader(modulePath, moduleFullDir, modulesContext, mode)) as TRequire;
    newRequire.main = { path: moduleFullDir, type: 'loader' };
  } else {
    newRequire = customRequire(moduleFullDir, context) as TRequire;
    newRequire.main = { path: moduleFullDir, type: 'require' };
  }
  context.require = newRequire;
  vm.createContext(context);
  vm.runInContext(script, context, { displayErrors: true });
  return module.exports;
};
