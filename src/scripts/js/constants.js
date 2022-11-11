const { join, resolve } = require('node:path');

exports.buildPath = 'js';
exports.backPath = './src/client';
exports.frontPath = '../node-y-n-w-front/src/api';
exports.fromBackToFront = [
  'common/api',
].map((i) => join(exports.backPath, i));
exports.fromFrontToBack = [
  'common', 'common/app',
].map((i) => join(exports.frontPath, i));
exports.excludeFromBack = [
  'local'
].map((i) => join(exports.backPath, i));
exports.excludeFromFront = [
  'local'
].map((i) => join(exports.frontPath, i));
exports.backStaticPath = './public';
exports.frontStaticPath = '../node-y-n-w-front/build';
exports.excludeStatic = [
  'assets/icons'
].map((i) => join(exports.frontStaticPath, i));
exports.filesToCopyFromBackToFront = [
  ['src/db/db.types.ts', 'local/db.types.ts'],
].map(([i, j]) => [resolve(i), join(exports.frontPath, j)]);
