import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { obj, query, queryToJson } from "../../client.ts";
import {
  createEngine,
  defaultResolver,
  parse,
  resolver,
} from "../../server.ts";
import type { Graph, Paginated, TodoItem } from "./graph.ts";

export interface AllTypes {
  Graph: Graph;
  Paginated: Paginated<any>;
  TodoItem: TodoItem;
}

const client = query<AllTypes>();

const graph = parse<AllTypes>(
  resolve("./tests/generics/graph.ts"),
);

Deno.test("Fails if no resolver", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph, graph.Paginated),
    ],
  });

  const query = client.Graph.todos._(({ total, data }) =>
    obj({
      total,
      data: data._(({ name, done }) => obj({ name, done })),
    })
  );
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "Invalid resolved value for root.Paginated.total (expected: number, received: undefined)",
  );
});

Deno.test("get generic results", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph),
      resolver(
        graph.Graph.todos,
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
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph),
      resolver(
        graph.Paginated,
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

Deno.test("Fails if a property is missing", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph),
      resolver(
        graph.Paginated,
        (ctx) => {
          return ctx.withValue({
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
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "Invalid resolved value for root.Paginated.total (expected: number, received: undefined)",
  );
});
