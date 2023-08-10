import { expect, test } from 'vitest';
import { errorBoundary, obj, query } from '../src/mod';
import { appSchema } from './basic/schema';

test('query version', () => {
  const q1 = query(appSchema)((s) => s.version);

  expect(q1).toMatchObject({ def: ['version'] });
});

test('query object', () => {
  const q1 = query(appSchema)((s) => obj({ currentVersion: s.version }));

  expect(q1).toMatchObject({ def: [['object', { currentVersion: ['version'] }]] });
});

test('query multiple settings (resolve multiple times)', () => {
  const q = query(appSchema)((s) =>
    obj({
      name: s.settings().appName,
      version: s.settings().appVersion,
    }),
  );

  expect(q).toMatchObject({
    def: [
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
  const q = query(appSchema)((s) =>
    s.settings((settings) =>
      obj({
        name: settings.appName,
        version: settings.appVersion,
      }),
    ),
  );

  expect(q).toMatchObject({
    def: ['settings', ['object', { name: ['appName'], version: ['appVersion'] }]],
  });
});

test('query connexion', () => {
  const q1 = query(appSchema)((s) =>
    obj({
      connexion: s
        .auth()
        .login({ email: 'a', otp: 'b', otpId: 'c' }, (me) => me(({ id, name, email }) => obj({ id, name, email }))),
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
  const q1 = query(appSchema)((s) =>
    s.workspaces.paginate(3, (workspace) =>
      workspace(({ id, name, storages }) =>
        obj({
          id,
          name,
          storages: storages.all((storage) => storage(({ id, description }) => obj({ id, description }))),
        }),
      ),
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
  const q1 = query(appSchema)((s) =>
    obj({
      first: s
        .workspace()
        .byTenant('first', (workspace) => workspace(({ id, name, tenant }) => obj({ id, name, tenant }))),
      second: s
        .workspace()
        .byTenant('second', (workspace) => workspace(({ id, name, tenant }) => obj({ id, name, tenant }))),
      third: s
        .workspace()
        .byTenant('third', (workspace) => workspace(({ id, name, tenant }) => obj({ id, name, tenant }))),
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

test('query multiple (factored)', () => {
  const q1 = query(appSchema)((s) =>
    s.workspace((wokspace) =>
      obj({
        first: wokspace.byTenant('first', (workspace) =>
          workspace(({ id, name, tenant }) => obj({ id, name, tenant })),
        ),
        second: wokspace.byTenant('second', (workspace) =>
          workspace(({ id, name, tenant }) => obj({ id, name, tenant })),
        ),
        third: wokspace.byTenant('third', (workspace) =>
          workspace(({ id, name, tenant }) => obj({ id, name, tenant })),
        ),
      }),
    ),
  );

  expect(q1).toMatchObject({
    def: [
      'workspace',
      [
        'object',
        {
          first: [
            'byTenant',
            { input: 'first', select: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]] },
          ],
          second: [
            'byTenant',
            { input: 'second', select: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]] },
          ],
          third: [
            'byTenant',
            { input: 'third', select: [['object', { id: ['id'], name: ['name'], tenant: ['tenant'] }]] },
          ],
        },
      ],
    ],
  });
});

test('nullable', () => {
  const q1 = query(appSchema)((s) => s.me((me) => me(({ id, name, email }) => obj({ id, name, email }))));

  expect(q1).toMatchObject({
    def: ['me', { nullable: [['object', { email: ['email'], id: ['id'], name: ['name'] }]] }],
  });

  const q2 = query(appSchema)((s) => s.me((me) => me().displayName.defined));

  expect(q2).toMatchObject({
    def: ['me', { nullable: ['displayName', { nullable: false }] }],
  });
});

test('errorBoundary abstract', () => {
  const q = query(appSchema)((s) =>
    obj({
      foo: errorBoundary(s.me.defined(({ id, name, email }) => obj({ id, name, email }))),
    }),
  );

  expect(q).toMatchObject({
    def: [
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
