import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../../client.ts";
import { createEngine, parse, resolver } from "../../server.ts";
import type { Graph, Namespace, StuffResult } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  Namespace: Namespace;
  StuffResult: StuffResult;
}

const graph = parse<AllTypes>(
  resolve("./tests/function/graph.ts"),
);

const client = query<AllTypes>();

Deno.test("Fails if no resolver", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [],
  });

  const query = client.Graph.sub.doStuff("hello", 1, { key: "value" }).num;
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "Invalid resolved value for root.StuffResult.num (expected: number, received: undefined)",
  );
});

Deno.test("get function results", async () => {
  let args: any[] = [];

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(
        graph.Graph.sub.doStuff,
        (ctx) => {
          args = ctx.getInputOrFail(graph.Graph.sub.doStuff);
          const res: StuffResult = { data: "hello", num: 42 };
          return ctx.withValue(res);
        },
      ),
    ],
  });

  const query = client.Graph.sub.doStuff("hello", 1, { key: "value" }).num;
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, 42);
  assertEquals(args, ["hello", 1, { key: "value" }]);
});

Deno.test("resolve on sub namespace", async () => {
  let args: any[] = [];

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(
        graph.Namespace.doStuff,
        (ctx) => {
          args = ctx.getInputOrFail(graph.Namespace.doStuff);
          return ctx.withValue({ num: 42 });
        },
      ),
    ],
  });

  const query = client.Graph.sub.doStuff("hello", 1, { key: "value" }).num;
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, 42);
  assertEquals(args, ["hello", 1, { key: "value" }]);
});
