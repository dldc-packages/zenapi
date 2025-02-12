import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../client.ts";
import { createEngine, defaultResolver, parse, resolver } from "../server.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

const client = query<TodoListTypes>();

const graph = parse<TodoListTypes>(
  resolve("./tests/schemas/todolist.ts"),
);

Deno.test("Resolver order on same node", async () => {
  const order: number[] = [];

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(
        graph.Graph,
        (ctx, next) => {
          order.push(1);
          return next(ctx.withValue({}));
        },
        (ctx, next) => {
          order.push(2);
          return next(ctx.withValue({}));
        },
      ),
      resolver(
        graph.Graph.config,
        (ctx) => {
          return ctx.withValue({
            env: { version: "1.0.0" },
          });
        },
      ),
    ],
  });

  const query = client.Graph.config.env.version;
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, "1.0.0");
  assertEquals(order, [1, 2]);
});

Deno.test("Resolver are applied from most specific to least", async (t) => {
  await t.step("Resolver are applied from most specific to least", async () => {
    const order: number[] = [];

    const engine = createEngine({
      graph,
      entry: "Graph",
      resolvers: [
        ...defaultResolver(graph.Graph),
        resolver(
          graph.Graph.config,
          (ctx, next) => {
            order.push(1);
            return next(ctx);
          },
        ),
        resolver(
          graph.Config,
          (ctx, next) => {
            order.push(2);
            return next(ctx.withValue({ env: { version: "1.0.0" } }));
          },
        ),
      ],
    });

    const query = client.Graph.config.env.version;
    const [queryDef, variables] = queryToJson(query);
    const result = await engine.run(queryDef, variables);
    assertEquals(result, "1.0.0");
    assertEquals(order, [1, 2]);
  });

  await t.step("Inverse order of resolvers should be the same", async () => {
    const order: number[] = [];

    const engine = createEngine({
      graph,
      entry: "Graph",
      resolvers: [
        ...defaultResolver(graph.Graph),
        resolver(
          graph.Config,
          (ctx, next) => {
            order.push(2);
            return next(ctx.withValue({ env: { version: "1.0.0" } }));
          },
        ),
        resolver(
          graph.Graph.config,
          (ctx, next) => {
            order.push(1);
            return next(ctx);
          },
        ),
      ],
    });

    const query = client.Graph.config.env.version;
    const [queryDef, variables] = queryToJson(query);
    const result = await engine.run(queryDef, variables);
    assertEquals(result, "1.0.0");
    assertEquals(order, [1, 2]);
  });
});
