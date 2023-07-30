import { expect, test } from 'vitest';
import { query } from '../src/mod';
import { appEngine } from './basic/engine';
import { appSchema } from './basic/schema';

test('resolve version', async () => {
  const q1 = query(appSchema, (s) => s.version);

  const res = await appEngine.run(q1.def);

  expect(res).toEqual('1.0.0');
});

test('resolve version in object', async () => {
  const q1 = query(appSchema, (s) => query.object({ currentVersion: s.version }));

  const res = await appEngine.run(q1.def);

  expect(res).toEqual({ currentVersion: '1.0.0' });
});

test('resolve connexion', async () => {
  const q1 = query(appSchema, (s) =>
    query.object({
      connexion: s.auth.login({ email: 'a', otp: 'b', otpId: 'c' }, ({ id, name, email }) =>
        query.object({ id, name, email }),
      ),
    }),
  );

  const res = await appEngine.run(q1.def);

  expect(res).toEqual({
    connexion: {
      id: '123',
      name: 'User',
      email: 'a',
    },
  });
});
