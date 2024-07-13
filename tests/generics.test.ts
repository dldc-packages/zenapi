import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { obj, query, queryToJson } from "../client.ts";
import { createEngine, parse, resolver } from "../server.ts";
import type { GenericTypes } from "./schemas/generic.types.ts";

const client = query<GenericTypes>();

const schema = parse<GenericTypes>(
  resolve("./tests/schemas/generic.ts"),
);

const g = schema.graph;

Deno.test("Fails if no resolver", () => {
  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [],
  });

  const query = client.Graph.todos._(({ total, data }) =>
    obj({
      total,
      data: data._(({ name, done }) => obj({ name, done })),
    })
  );
  const [queryDef, variables] = queryToJson(query);
  assertRejects(() => engine.run(queryDef, variables));
});

Deno.test("get generic results", async () => {
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

Deno.test("Resolver in generic", async () => {
  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [
      resolver(
        g.Paginated,
        (ctx) => {
          return ctx.withValue({
            total: 0,
            data: [],
          });
        },
      ),
    ],
  });

  const query = client.Graph.todos._(({ total, data }) =>
    obj({
      total,
      data: data._(({ name, done }) => obj({ name, done })),
    })
  );
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, {
    total: 0,
    data: [],
  });
});
