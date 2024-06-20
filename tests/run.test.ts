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

  const g = schema.graph;

  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [
      resolver(
        g.Graph.config.env.version,
        (ctx) => ctx.withValue("1.0.0"),
      ),
    ],
  });

  const query = client.Graph.config.env.version;
  const result = await engine.run(queryToJson(query));
  assertEquals(result, "1.0.0");
});
