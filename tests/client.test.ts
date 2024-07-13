import { assertEquals } from "@std/assert";
import { obj, query, queryToJson } from "../client.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

const client = query<TodoListTypes>();

Deno.test("simple query", () => {
  const query = client.Graph.config.env.version;
  assertEquals(queryToJson(query), [
    ["Graph", "config", "env", "version"],
    [],
  ]);
});

Deno.test("simple nested query", () => {
  const query = client.Graph._((e) => e.config.env.version);
  assertEquals(queryToJson(query), [
    [
      "Graph",
      "config",
      "env",
      "version",
    ],
    [],
  ]);
});

Deno.test("root object query", () => {
  const query = obj({
    version1: client.Graph.config.env.version,
    version2: client.Graph.config.env.version,
  });

  assertEquals(queryToJson(query), [
    [{
      kind: "object",
      data: [
        { key: "version1", value: ["Graph", "config", "env", "version"] },
        { key: "version2", value: ["Graph", "config", "env", "version"] },
      ],
    }],
    [],
  ]);
});

Deno.test("sub select", () => {
  const query = client.Graph.config.env._(({ bool, num, str }) =>
    obj({ bool, num, str })
  );

  assertEquals(
    queryToJson(query),
    [
      [
        "Graph",
        "config",
        "env",
        {
          kind: "object",
          data: [
            { key: "bool", value: ["bool"] },
            { key: "num", value: ["num"] },
            { key: "str", value: ["str"] },
          ],
        },
      ],
      [],
    ],
  );
});

Deno.test("call", () => {
  const query = client.Graph.apps.all({ page: 1, limit: 10 })._(({ appName }) =>
    appName
  );
  assertEquals(queryToJson(query), [
    ["Graph", "apps", "all", "()", "appName"],
    [
      [{ limit: 10, page: 1 }],
    ],
  ]);
});

Deno.test("call in obj", () => {
  const query = obj({
    foo: client.Graph.apps.all({ page: 1, limit: 10 })._(({ appName }) =>
      appName
    ),
    bar: client.Graph.apps.all({ page: 2, limit: 20 })._(({ appName }) =>
      appName
    ),
  });
  assertEquals(queryToJson(query), [
    [{
      kind: "object",
      data: [
        { key: "foo", value: ["Graph", "apps", "all", "()", "appName"] },
        { key: "bar", value: ["Graph", "apps", "all", "()", "appName"] },
      ],
    }],
    [
      [{ limit: 10, page: 1 }],
      [{ limit: 20, page: 2 }],
    ],
  ]);
});

Deno.test("call in sub select", () => {
  const query = client.Graph.apps._(({ all, byId }) =>
    obj({
      all: all({ page: 1, limit: 10 })._(({ appName }) => appName),
      byId: byId("some-id").todos._(({ done }) => done),
    })
  );

  assertEquals(
    queryToJson(query),
    [
      [
        "Graph",
        "apps",
        {
          kind: "object",
          data: [
            { key: "all", value: ["all", "()", "appName"] },
            { key: "byId", value: ["byId", "()", "todos", "done"] },
          ],
        },
      ],
      [
        [{ limit: 10, page: 1 }],
        ["some-id"],
      ],
    ],
  );
});

Deno.test("obj in array select", () => {
  const query = client.Graph.apps.all({ limit: 10, page: 1 })._(({ appName }) =>
    obj({ name1: appName, name2: appName })
  );

  assertEquals(
    queryToJson(query),
    [
      [
        "Graph",
        "apps",
        "all",
        "()",
        {
          kind: "object",
          data: [
            { key: "name1", value: ["appName"] },
            { key: "name2", value: ["appName"] },
          ],
        },
      ],
      [
        [{ limit: 10, page: 1 }],
      ],
    ],
  );
});

Deno.test("nested object", () => {
  const query = client.Graph.auth._(({ user: { userName } }) =>
    obj({ user: obj({ userName }) })
  );

  assertEquals(
    queryToJson(query),
    [
      [
        "Graph",
        "auth",
        {
          kind: "object",
          data: [
            {
              key: "user",
              value: [
                {
                  data: [{ key: "userName", value: ["user", "userName"] }],
                  kind: "object",
                },
              ],
            },
          ],
        },
      ],
      [],
    ],
  );
});

Deno.test("better nested object", () => {
  const query = client.Graph.auth._(({ user }) =>
    obj({ user: user._(({ userName }) => obj({ userName })) })
  );

  assertEquals(
    queryToJson(query),
    [
      [
        "Graph",
        "auth",
        {
          kind: "object",
          data: [
            {
              key: "user",
              value: [
                "user",
                {
                  kind: "object",
                  data: [{ key: "userName", value: ["userName"] }],
                },
              ],
            },
          ],
        },
      ],
      [],
    ],
  );
});
