import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../../client.ts";
import { createEngine, parse, resolver } from "../../server.ts";
import type { Graph, Namespace } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  Namespace: Namespace;
}

const schema = parse<AllTypes>(
  resolve("./tests/function/graph.ts"),
);

const client = query<AllTypes>();

const g = schema.graph;

Deno.test("Fails if no resolver", async () => {
  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [],
  });

  const query = client.Graph.sub.doStuff("hello", 1, { key: "value" });
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "Value is undefined at Namespace.doStuff.returns",
  );
});

Deno.test("get function results", async () => {
  let args: any[] = [];

  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [
      resolver(
        g.Graph.sub.doStuff,
        (ctx) => {
          args = ctx.getInputOrFail(g.Graph.sub.doStuff);

          return ctx.withValue(null);
        },
      ),
    ],
  });

  const query = client.Graph.sub.doStuff("hello", 1, { key: "value" });
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, null);
  assertEquals(args, ["hello", 1, { key: "value" }]);
});

Deno.test("resolve on sub namespace", async () => {
  let args: any[] = [];

  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [
      resolver(
        g.Namespace.doStuff,
        (ctx) => {
          args = ctx.getInputOrFail(g.Namespace.doStuff);

          return ctx.withValue(null);
        },
      ),
    ],
  });

  const query = client.Graph.sub.doStuff("hello", 1, { key: "value" });
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, null);
  assertEquals(args, ["hello", 1, { key: "value" }]);
});
