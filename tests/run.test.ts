import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../client.ts";
import { createEngine, parseSchema, resolver } from "../server.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

const client = query<TodoListTypes>();

Deno.test("run query", async (t) => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );

  const g = schema.graph;

  const engine = createEngine({
    schema,
    entry: "Graph",
    handlers: [
      resolver(
        g.Graph.config.env.version,
        (ctx) => {
          return ctx.withValue("1.0.0");
        },
      ),
      resolver(
        g.Graph.apps.all,
        (ctx) => {
          const [pagination] = ctx.getInputOrFail(g.Graph.apps.all.parameters);
          return ctx.withValue([
            { appName: "app1", other: pagination },
            { appName: "app2" },
          ]);
        },
      ),
    ],
  });

  await t.step("simple query", async () => {
    const query = client.Graph.config.env.version;
    const [queryDef, variables] = queryToJson(query);
    const result = await engine.run(queryDef, variables);
    assertEquals(result, "1.0.0");
  });

  await t.step("call query", async () => {
    const query = client.Graph.apps.all({ limit: 10, page: 1 })._((
      { appName },
    ) => appName);
    const [queryDef, variables] = queryToJson(query);
    const result = await engine.run(queryDef, variables);
    assertEquals(result, ["app1", "app2"]);
  });

  await t.step("call query with invalid params should throw", async () => {
    const query = client.Graph.apps.all({ limit: 10, yolo: true } as any)._((
      { appName },
    ) => appName);
    const [queryDef, variables] = queryToJson(query);
    await assertRejects(
      async () => {
        await engine.run(queryDef, variables);
      },
    );
  });
});
