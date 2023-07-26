import { expect, test } from 'vitest';
import { query } from '../src/mod';
import { schema } from './basic/schema';

test('query 1', () => {
  const q1 = query(schema, (s) => ({
    connexion: s.auth.login.formData(new FormData()).select(({ id, name, email }) => ({ id, name, email })),
  }));

  expect(q1).toMatchInlineSnapshot(`
    {
      "def": {
        "kind": "select",
        "select": {
          "connexion": {
            "def": {
              "kind": "select",
              "select": {
                "email": {
                  "def": {
                    "kind": "property",
                    "property": "email",
                    Symbol(PARENT): {
                      "input": {
                        "data": FormData {
                          Symbol(state): [],
                        },
                        "type": "formdata",
                      },
                      "kind": "func",
                      Symbol(PARENT): {
                        "kind": "property",
                        "property": "login",
                        Symbol(PARENT): {
                          "kind": "property",
                          "property": "auth",
                          Symbol(PARENT): null,
                        },
                      },
                    },
                  },
                  Symbol(RESULT): {},
                },
                "id": {
                  "def": {
                    "kind": "property",
                    "property": "id",
                    Symbol(PARENT): {
                      "input": {
                        "data": FormData {
                          Symbol(state): [],
                        },
                        "type": "formdata",
                      },
                      "kind": "func",
                      Symbol(PARENT): {
                        "kind": "property",
                        "property": "login",
                        Symbol(PARENT): {
                          "kind": "property",
                          "property": "auth",
                          Symbol(PARENT): null,
                        },
                      },
                    },
                  },
                  Symbol(RESULT): {},
                },
                "name": {
                  "def": {
                    "kind": "property",
                    "property": "name",
                    Symbol(PARENT): {
                      "input": {
                        "data": FormData {
                          Symbol(state): [],
                        },
                        "type": "formdata",
                      },
                      "kind": "func",
                      Symbol(PARENT): {
                        "kind": "property",
                        "property": "login",
                        Symbol(PARENT): {
                          "kind": "property",
                          "property": "auth",
                          Symbol(PARENT): null,
                        },
                      },
                    },
                  },
                  Symbol(RESULT): {},
                },
              },
              Symbol(PARENT): null,
            },
            Symbol(RESULT): null,
          },
        },
        Symbol(PARENT): null,
      },
      Symbol(RESULT): null,
    }
  `);
});

// const q2 = query(schema, (s) =>
//   s.workspaces.paginate(1, ({ id, name, storages }) => ({
//     id,
//     name,
//     storages: storages.all(({ id, description }) => ({ id, description })),
//   })),
// );

// console.log(q2);

// const q3 = query(schema, (s) => ({
//   first: s.workspace.json({ tenant: 'first', id: null }, ({ id, name, tenant }) => ({ id, name, tenant })),
//   second: s.workspace.json({ tenant: 'first', id: null }, ({ id, name, tenant }) => ({ id, name, tenant })),
//   third: s.workspace.json({ tenant: 'first', id: null }, ({ id, name, tenant }) => ({ id, name, tenant })),
// }));

// console.log(q3);
