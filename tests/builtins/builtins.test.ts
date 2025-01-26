import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { assertSnapshot } from "@std/testing/snapshot";
import * as v from "@valibot/valibot";
import { query, queryToJson } from "../../client.ts";
import {
  builtin,
  createBuiltins,
  createEngine,
  DEFAULT_BUILTINS,
  parse,
  resolver,
  ROOT,
} from "../../server.ts";
import type { MyBuiltin } from "./builtins.ts";
import type { Graph } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
}

const builtins = createBuiltins({
  ...DEFAULT_BUILTINS,
  MyBuiltin: builtin<MyBuiltin>({
    getSchema: () => v.string(),
    match: (value) => typeof value === "string",
    prepare: () => {
      return async (ctx, next) => {
        const res = await next(ctx);
        const value = res.value;
        if (typeof value !== "string") {
          throw new Error("Value is not a string at builtin.MyBuiltin");
        }
        return ctx;
      };
    },
  }),
});

const graph = parse<AllTypes>(
  resolve("./tests/builtins/graph.ts"),
  builtins,
);

Deno.test("Snapshot structure", async (test) => {
  await assertSnapshot(test, graph[ROOT]);
});

const client = query<AllTypes>();

Deno.test("Properly parse MyBuiltin", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(graph.Graph.now, (ctx) => {
        return ctx.withValue("Hello");
      }),
    ],
  });

  const query = client.Graph.now;
  const [queryDef, variables] = queryToJson(query);
  const res = await engine.run(queryDef, variables);
  assertEquals(res, "Hello");
});

Deno.test("Fail if output is not a string", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(graph.Graph.now, (ctx) => {
        return ctx.withValue(42);
      }),
    ],
  });

  const query = client.Graph.now;
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "Value is not a string at builtin.MyBuiltin",
  );
});

Deno.test("MyBuiltin input", async (t) => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(graph.Graph.doStuff.return, (ctx) => {
        const [builtin] = ctx.getInputOrFail(graph.Graph.doStuff);
        return ctx.withValue<string>(builtin);
      }),
    ],
  });

  await t.step("Parse MyBuiltin input", async () => {
    const query = client.Graph.doStuff(
      "Hello",
    );
    const [queryDef, variables] = queryToJson(query);
    const res = await engine.run(queryDef, variables);
    assertEquals(res, "Hello");
  });

  await t.step("Fail if input is not a string", async () => {
    const query = client.Graph.doStuff(42 as any);
    const [queryDef, variables] = queryToJson(query);
    const err = await assertRejects(() => engine.run(queryDef, variables));
    assertEquals(
      (err as Error).message,
      "Invalid arguments passed to root.Graph.doStuff",
    );
  });
});
