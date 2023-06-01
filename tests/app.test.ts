import test from 'node:test';
import assert from 'node:assert';
import { TEST_DATA_ARR } from './data/test.data';
import { ITestRunnerData } from './types/types';
import { prepareTest } from './utils/test.utils';
import { runScript } from './utils/utils';

const runTest = ({
  title,
  connections,
  testCases,
}: ITestRunnerData) =>
  test(title, async (t) => {
    for (const [{ title, operations }, conNumber] of testCases) {
      await t.test(title + ' [' + conNumber + ']', async (t) => {
        for (const operation of operations) {
          const { name, params, expected, toState } = operation;
          await t.test(name, async () => {
            const data = typeof params === 'function' ? params() : params;
            const actual = await connections[conNumber]?.(name, data);
            toState?.(actual);
            if (!expected) return;
            if (typeof expected === 'function') expected(actual);
            else assert.deepEqual(actual, expected);
          });
        }
      });
    }
  });

const runAllTests = async () => {
  runScript('rm tests/db/log.txt');
  for (const testData of TEST_DATA_ARR) {
    const { testRunnerData, finalize } = await prepareTest(testData);
    await runTest(testRunnerData);
    await finalize();
  }
};

runAllTests();
