import { expect, test } from 'vitest';
import { query } from '../src/mod';
import { schema } from './basic/schema';

test('query version', () => {
  const q1 = query(schema, (s) => s.version);

  expect(q1).toMatchObject({
    def: ['version'],
  });
});

test('query object', () => {
  const q1 = query(schema, (s) => query.object({ currentVersion: s.version }));

  expect(q1).toMatchObject({
    def: [['object', { currentVersion: ['version'] }]],
  });
});

test('query connexion', () => {
  const q1 = query(schema, (s) =>
    query.object({
      connexion: s.auth.login({ email: 'a', otp: 'b', otpId: 'c' }, ({ id, name, email }) =>
        query.object({ id, name, email }),
      ),
    }),
  );

  expect(q1).toMatchObject({
    def: [
      [
        'object',
        {
          connexion: [
            'auth',
            'login',
            {
              input: { email: 'a', otp: 'b', otpId: 'c' },
              select: [['object', { id: ['id'], name: ['name'], email: ['email'] }]],
            },
          ],
        },
      ],
    ],
  });
});

test('query nested', () => {
  const q1 = query(schema, (s) =>
    s.workspaces.paginate(3, ({ id, name, storages }) =>
      query.object({
        id,
        name,
        storages: storages.all(({ id, description }) => query.object({ id, description })),
      }),
    ),
  );

  expect(q1).toMatchObject({
    def: [
      'workspaces',
      {
        type: 'paginate',
        page: 3,
        select: [
          [
            'object',
            {
              id: ['id'],
              name: ['name'],
              storages: [
                'storages',
                { type: 'all', select: [['object', { id: ['id'], description: ['description'] }]] },
              ],
            },
          ],
        ],
      },
    ],
  });
});

test('query multiple', () => {
  const q1 = query(schema, (s) =>
    query.object({
      first: s.workspace.byTenant('first', ({ id, name, tenant }) => query.object({ id, name, tenant })),
      second: s.workspace.byTenant('second', ({ id, name, tenant }) => query.object({ id, name, tenant })),
      third: s.workspace.byTenant('third', ({ id, name, tenant }) => query.object({ id, name, tenant })),
    }),
  );

  expect(q1).toMatchObject({
    def: [
      [
        'object',
        {
          first: [
            'workspace',
            'byTenant',
            { input: 'first', select: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]] },
          ],
          second: [
            'workspace',
            'byTenant',
            { input: 'second', select: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]] },
          ],
          third: [
            'workspace',
            'byTenant',
            { input: 'third', select: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]] },
          ],
        },
      ],
    ],
  });
});
