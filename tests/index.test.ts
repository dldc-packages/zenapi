import { expect, test } from 'vitest';
import { obj, query } from '../src/mod';
import { appEngine } from './basic/engine';
import { appSchema } from './basic/schema';

test('resolve version', async () => {
  const q = query(appSchema)((s) => s.version);

  const res = await appEngine.run(q);

  expect(res).toEqual('1.0.0');
});

test('resolve version in object', async () => {
  const q1 = query(appSchema)((s) => obj({ currentVersion: s.version }));

  const res = await appEngine.run(q1);

  expect(res).toEqual({ currentVersion: '1.0.0' });
});

test('resolve connexion', async () => {
  const q = query(appSchema)((s) =>
    obj({
      connexion: s
        .auth()
        .login({ email: 'a', otp: 'b', otpId: 'c' }, (me) => me(({ id, name, email }) => obj({ id, name, email }))),
    }),
  );

  const res = await appEngine.run(q);

  expect(res).toEqual({
    connexion: {
      id: '123',
      name: 'User',
      email: 'a',
    },
  });
});

test('nullable', async () => {
  const q = query(appSchema)((s) => s.me((me) => me(({ id, name, email }) => obj({ id, name, email }))));

  const res = await appEngine.run(q);

  expect(res).toEqual(null);
});
