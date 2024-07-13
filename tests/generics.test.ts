import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { obj, query, queryToJson } from "../client.ts";
import { createEngine, parse, resolver } from "../server.ts";
import type { GenericTypes } from "./schemas/generic.types.ts";

const client = query<GenericTypes>();

const schema = parse<GenericTypes>(
  resolve("./tests/schemas/generic.ts"),
);

// console.log(JSON.stringify(schema.structure, null, 2));

const g = schema.graph;

const engine = createEngine({
  schema,
  entry: "Graph",
  resolvers: [
    resolver(
      g.Graph.todos,
      (ctx) => {
        return ctx.withValue({
          total: 1,
          data: [{ name: "todo1", done: true }],
        });
      },
    ),
  ],
});

Deno.test("get generic results", async () => {
  const query = client.Graph.todos._(({ total, data }) =>
    obj({
      total,
      data: data._(({ name, done }) => obj({ name, done })),
    })
  );
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, {
    total: 1,
    data: [{ name: "todo1", done: true }],
  });
});
