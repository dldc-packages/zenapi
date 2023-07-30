import { expect, test } from 'vitest';
import { query } from '../src/mod';
import { apiEngine } from './basic/engine';
import { schema } from './basic/schema';

test('resolve version', async () => {
  const q1 = query(schema, (s) => s.version);

  const res = await apiEngine.run(q1.def);

  expect(res).toEqual('1.0.0');
});

test('resolve version in object', async () => {
  const q1 = query(schema, (s) => query.object({ currentVersion: s.version }));

  const res = await apiEngine.run(q1.def);

  expect(res).toEqual({ currentVersion: '1.0.0' });
});

test('resolve connexion', async () => {
  const q1 = query(schema, (s) =>
    query.object({
      connexion: s.auth.login({ email: 'a', otp: 'b', otpId: 'c' }, ({ id, name, email }) =>
        query.object({ id, name, email }),
      ),
    }),
  );

  const res = await apiEngine.run(q1.def);

  expect(res).toEqual({
    connexion: {
      id: '123',
      name: 'User',
      email: 'a',
    },
  });
});
