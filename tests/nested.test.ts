import { expect, test } from 'vitest';
import { obj, query } from '../src/mod';
import { appEngine } from './nested/engine';
import { appSchema } from './nested/schema';

test('resolve user should be null', async () => {
  const q = query(appSchema).personal((p) => p().user((u) => obj(u)));
  const res = await appEngine.run(q);
  expect(res).toBeNull();
});

test('resolve login should get authenticated user', async () => {
  const q = query(appSchema).login({ email: 'user@example.com', password: 'whatever' }, (p) =>
    p(({ user }) => user((u) => obj(u))),
  );
  const res = await appEngine.run(q);
  expect(res).toEqual({
    id: '123',
    name: 'User',
    email: 'user@example.com',
  });
});
