import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { obj, query, queryToJson } from "../client.ts";
import { createEngine, parse, resolver } from "../server.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

const client = query<TodoListTypes>();

const graph = parse<TodoListTypes>(
  resolve("./tests/schemas/todolist.ts"),
);

const engine = createEngine({
  graph,
  entry: "Graph",
  resolvers: [
    resolver(
      graph.Graph.config.env.version,
      (ctx) => {
        return ctx.withValue("1.0.0");
      },
    ),
    resolver(
      graph.Graph.apps.all,
      (ctx) => {
        const [pagination] = ctx.getInputOrFail(graph.Graph.apps.all);
        return ctx.withValue([
          { appName: "app1", other: pagination },
          { appName: "app2" },
        ]);
      },
    ),
  ],
});

Deno.test("simple query", async () => {
  const query = client.Graph.config.env.version;
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, "1.0.0");
});

Deno.test("call query", async () => {
  const query = client.Graph.apps.all({ limit: 10, page: 1 })._((
    { appName },
  ) => appName);
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, ["app1", "app2"]);
});

Deno.test("call query with invalid params should throw", async () => {
  const query = client.Graph.apps
    .all({ limit: 10, yolo: true } as any)._((c) => c.appName);
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(
    async () => {
      await engine.run(queryDef, variables);
    },
  );
  assertEquals(
    (err as Error).message,
    "Invalid type: Expected never but received true",
  );
});

Deno.test("should throw when query does not target entry", async () => {
  const query = client.Config.env.version;
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(
    async () => {
      await engine.run(queryDef, variables);
    },
  );
  assertEquals((err as Error).message, "Invalid entry point: Config");
});

Deno.test("run query with top level object", async () => {
  const query = obj({
    version: client.Graph.config.env.version,
    apps: client.Graph.apps.all({ limit: 10, page: 1 })._(({ appName }) =>
      appName
    ),
  });
  const [queryDef, variables] = queryToJson(query);
  const res = await engine.run(queryDef, variables);
  assertEquals(res, { version: "1.0.0", apps: ["app1", "app2"] });
});

Deno.test("run query with object as subquery", async () => {
  const query = client.Graph.apps.all({ limit: 10, page: 1 })._(({ appName }) =>
    obj({ name1: appName, name2: appName })
  );
  const [queryDef, variables] = queryToJson(query);
  const res = await engine.run(queryDef, variables);
  assertEquals(res, [{
    name1: "app1",
    name2: "app1",
  }, {
    name1: "app2",
    name2: "app2",
  }]);
});

Deno.test("run query on entire object should throw 1", async () => {
  const query = client.Graph.apps.all({ limit: 10, page: 1 })._(({ todos }) =>
    todos
  );
  const [queryDef, variables] = queryToJson(query);
  await assertRejects(async () => {
    await engine.run(queryDef, variables);
  });
});

Deno.test("run query on entire object should throw 2", async () => {
  const query = client.Graph.apps;
  const [queryDef, variables] = queryToJson(query);
  await assertRejects(async () => {
    await engine.run(queryDef, variables);
  });
});

Deno.test("run query on entire object should throw 3", async () => {
  const query = client.Graph.apps.all({ limit: 10, page: 1 })._(({ todos }) =>
    obj({ todos })
  );
  const [queryDef, variables] = queryToJson(query);
  await assertRejects(async () => {
    await engine.run(queryDef, variables);
  });
});
