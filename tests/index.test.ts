import { expect, test } from 'vitest';
import { query } from '../src/mod';
import { apiEngine } from './basic/engine';
import { schema } from './basic/schema';

test('resolve version', async () => {
  const q1 = query(schema, (s) => s.version);

  const res = await apiEngine.run(q1.def);

  expect(res).toEqual('1.0.0');
});
