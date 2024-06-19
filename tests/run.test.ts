import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { queryBuilder, queryToJson } from "../client.ts";
import { createEngine, parseSchema, resolver } from "../server.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

const client = queryBuilder<TodoListTypes>();

Deno.test("run query", async () => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );

  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [
      resolver(
        schema.graph.Graph.config.env.version,
        (ctx) => ctx.withValue(1),
      ),
      resolver(
        schema.graph.Graph.config._(schema.graph.Config).env.version,
        (ctx) => ctx.withValue(1),
      ),
      resolver(schema.graph.Config.env.version, (ctx) => ctx.withValue(2)),
    ],
  });

  const query = client.Graph.config.env.version;

  const result = await engine.run(queryToJson(query));

  assertEquals(result, "1");
});
