import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { queryBuilder, queryToJson } from "../client.ts";
import { createEngine, parseSchema, resolver } from "../server.ts";
import { TodoListTypes } from "./schemas/types.ts";

const client = queryBuilder<TodoListTypes>();

Deno.test("run query", () => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );

  const engine = createEngine({
    schema,
    resolvers: [
      resolver(schema.ref.Graph.config.env.version, (ctx) => ctx.withValue(1)),
      resolver(
        schema.ref.Graph.config._(schema.ref.Config.env.version),
        (ctx) => ctx.withValue(1),
      ),
      resolver(schema.ref.Config.env.version, (ctx) => ctx.withValue(2)),
    ],
  });

  const query = queryToJson(client.Graph.config.env.version);

  const result = engine.run(query);

  assertEquals(result, 1);
});
