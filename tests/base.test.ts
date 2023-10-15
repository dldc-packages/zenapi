import { expect, test } from 'vitest';
import { obj, query } from '../src/mod';
import { appEngine } from './basic/engine';
import { appSchema } from './basic/schema';

test('resolve version', async () => {
  const q = query(appSchema).version;

  const res = await appEngine.run(q);

  expect(res).toEqual({
    result: '1.0.0',
    success: true,
  });
});

test('resolve version in object', async () => {
  const q1 = obj({ currentVersion: query(appSchema).version });
  const res = await appEngine.run(q1);
  expect(res).toEqual({
    result: { currentVersion: '1.0.0' },
    success: true,
  });
});

test('resolve connexion', async () => {
  const q = obj({
    connexion: query(appSchema).auth.login({ email: 'a', otp: 'b', otpId: 'c' }, (me) =>
      me(({ id, name, email }) => obj({ id, name, email })),
    ),
  });

  const res = await appEngine.run(q);

  expect(res).toEqual({
    success: true,
    result: {
      connexion: {
        id: '123',
        name: 'User',
        email: 'a',
      },
    },
  });
});

test('nullable', async () => {
  const q = query(appSchema).me((me) => me(({ id, name, email }) => obj({ id, name, email })));

  const res = await appEngine.run(q);

  expect(res).toEqual({
    success: true,
    result: null,
  });
});
