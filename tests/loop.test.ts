import { assert, expect, test } from 'vitest';
import { obj, query } from '../src/mod';
import { appEngine } from './loop/engine';
import { schema } from './loop/schema';

test('resolve recursive resolvers', async () => {
  const q = query(schema).app(({ appName, user }) =>
    obj({ appName, user: user(({ userName, app }) => obj({ userName, app: app(({ appName }) => obj({ appName })) })) }),
  );
  const res = await appEngine.run(q);
  expect(res).toMatchObject({ success: true });
  assert(res.success);
  expect(res.result).toEqual({
    appName: 'App',
    user: { app: { appName: 'App' }, userName: 'User' },
  });
});
