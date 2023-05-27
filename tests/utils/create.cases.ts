import path from 'node:path';
import fsp from 'node:fs/promises';
import { ITestCases, TTestCase } from '../types/types';

export const EXCLUDE_CASES: string[] = [];

export const createCases = async (dirPath: string): Promise<ITestCases> => {
  const cases: ITestCases = {};
  const casesPath = path.resolve(dirPath);
  const dir = await fsp.opendir(casesPath);

  for await (const item of dir) {
    const ext = path.extname(item.name);
    const name = path.basename(item.name, ext);
    if (EXCLUDE_CASES.includes(name)) continue;

    if (item.isDirectory()) {
      const dirPath = path.join(casesPath, name);
      cases[name] = await createCases(dirPath);
      continue;
    }

    if (ext !== '.js') continue;

    const filePath = path.join(casesPath, item.name);
    let moduleExport = require(filePath);
    moduleExport = moduleExport.default ||
      moduleExport as TTestCase | ITestCases;

    if (name !== 'index') {
      cases[name] = moduleExport;
      continue;
    }

    if (typeof moduleExport === 'function')
      throw new Error(`Wrong api module: ${filePath}`);

    Object.assign(cases, moduleExport);
  }

  // dir.close();
  return cases;
};
