import { expect, test } from 'vitest';
import { query } from '../src/mod';
import { schema } from './basic/schema';

test('query version', () => {
  const q1 = query(schema, (s) => s.version);

  expect(q1).toMatchObject({
    def: ['version'],
  });
});

test('query alias', () => {
  const q1 = query(schema, (s) => ({ currentVersion: s.version }));

  expect(q1).toMatchObject({
    def: [{ currentVersion: ['version'] }],
  });
});

test('query connexion', () => {
  const q1 = query(schema, (s) => ({
    connexion: s.auth.login({ email: 'a', otp: 'b', otpId: 'c' }, ({ id, name, email }) => ({ id, name, email })),
  }));

  expect(q1).toMatchObject({
    def: [
      {
        connexion: [
          'auth',
          'login',
          { email: 'a', otp: 'b', otpId: 'c' },
          { id: ['id'], name: ['name'], email: ['email'] },
        ],
      },
    ],
  });
});

test('query nested', () => {
  const q1 = query(schema, (s) =>
    s.workspaces.paginate(3, ({ id, name, storages }) => ({
      id,
      name,
      storages: storages.all(({ id, description }) => ({ id, description })),
    })),
  );

  expect(q1).toMatchObject({
    def: [
      'workspaces',
      3,
      { id: ['id'], name: ['name'], storages: ['storages', 'all', { id: ['id'], description: ['description'] }] },
    ],
  });
});

test('query multiple', () => {
  const q1 = query(schema, (s) => ({
    first: s.workspace.byTenant('first', ({ id, name, tenant }) => ({ id, name, tenant })),
    second: s.workspace.byTenant('second', ({ id, name, tenant }) => ({ id, name, tenant })),
    third: s.workspace.byTenant('third', ({ id, name, tenant }) => ({ id, name, tenant })),
  }));

  expect(q1).toMatchObject({
    def: [
      {
        first: ['workspace', 'byTenant', 'first', { id: ['id'], name: ['name'], tenant: ['tenant'] }],
        second: ['workspace', 'byTenant', 'second', { id: ['id'], name: ['name'], tenant: ['tenant'] }],
        third: ['workspace', 'byTenant', 'third', { id: ['id'], name: ['name'], tenant: ['tenant'] }],
      },
    ],
  });
});
