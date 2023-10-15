import { expect, test } from 'vitest';
import { errorBoundary, obj, query } from '../src/mod';
import { appSchema } from './basic/schema';

test('query version', () => {
  const q1 = query(appSchema).version;

  expect(q1).toMatchObject({ query: ['version'] });
});

test('query object', () => {
  const q1 = obj({ currentVersion: query(appSchema).version });

  expect(q1).toMatchObject({ query: [['object', { currentVersion: ['version'] }]] });
});

test('query multiple settings (resolve multiple times)', () => {
  const q = obj({
    name: query(appSchema).settings().appName,
    version: query(appSchema).settings().appVersion,
  });

  expect(q).toMatchObject({
    query: [
      [
        'object',
        {
          name: ['settings', 'appName'],
          version: ['settings', 'appVersion'],
        },
      ],
    ],
  });
});

test('query multiple inside settings (resolve only once)', () => {
  const q = query(appSchema).settings((settings) =>
    obj({
      name: settings.appName,
      version: settings.appVersion,
    }),
  );

  expect(q).toMatchObject({
    query: ['settings', ['object', { name: ['appName'], version: ['appVersion'] }]],
  });
});

test('query connexion', () => {
  const q1 = obj({
    connexion: query(appSchema).auth.login({ email: 'a', otp: 'b', otpId: 'c' }, (me) =>
      me(({ id, name, email }) => obj({ id, name, email })),
    ),
  });

  expect(q1).toMatchObject({
    query: [
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
  const q1 = query(appSchema).workspaces.paginate(3, (workspace) =>
    workspace(({ id, name, storages }) =>
      obj({
        id,
        name,
        storages: storages.all((storage) => storage(({ id, description }) => obj({ id, description }))),
      }),
    ),
  );

  expect(q1).toMatchObject({
    query: [
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
  const q1 = obj({
    first: query(appSchema).workspace.byTenant('first', (workspace) =>
      workspace(({ id, name, tenant }) => obj({ id, name, tenant })),
    ),
    second: query(appSchema).workspace.byTenant('second', (workspace) =>
      workspace(({ id, name, tenant }) => obj({ id, name, tenant })),
    ),
    third: query(appSchema).workspace.byTenant('third', (workspace) =>
      workspace(({ id, name, tenant }) => obj({ id, name, tenant })),
    ),
  });

  expect(q1).toMatchObject({
    query: [
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

test('query multiple (factored)', () => {
  const q1 = query(appSchema).workspace.byTenant('first', (workspace) =>
    workspace(({ id, name, tenant }) =>
      obj({
        first: obj({ id, name, tenant }),
        second: obj({ id, name, tenant }),
        third: obj({ id, name, tenant }),
      }),
    ),
  );

  expect(q1).toMatchObject({
    query: [
      'workspace',
      'byTenant',
      {
        input: 'first',
        select: [
          [
            'object',
            {
              first: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]],
              second: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]],
              third: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]],
            },
          ],
        ],
      },
    ],
  });
});

test('nullable', () => {
  const q1 = query(appSchema).me((me) => me(({ id, name, email }) => obj({ id, name, email })));

  expect(q1).toMatchObject({
    query: ['me', { nullable: [['object', { email: ['email'], id: ['id'], name: ['name'] }]] }],
  });

  const q2 = query(appSchema).me((me) => me().displayName.defined);

  expect(q2).toMatchObject({
    query: ['me', { nullable: ['displayName', { nullable: false }] }],
  });
});

test('errorBoundary abstract', () => {
  const q = obj({
    foo: errorBoundary(query(appSchema).me.defined(({ id, name, email }) => obj({ id, name, email }))),
  });

  expect(q).toMatchObject({
    query: [
      [
        'object',
        {
          foo: [
            [
              'errorBoundary',
              ['me', { nullable: false }, ['object', { email: ['email'], id: ['id'], name: ['name'] }]],
            ],
          ],
        },
      ],
    ],
  });
});
