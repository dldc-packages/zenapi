import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import type { IsExact } from "@std/testing/types";
import { query, queryToJson, type TQueryBase } from "../../client.ts";
import {
  createEngine,
  defaultResolver,
  parse,
  resolver,
} from "../../server.ts";
import { assertType } from "../utils/assertType.ts";
import type { Graph, Namespace } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  Namespace: Namespace;
}

const graph = parse<AllTypes>(
  resolve("./tests/date/graph.ts"),
);

const client = query<AllTypes>();

Deno.test("Properly parse Date", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph, graph.Namespace),
      resolver(graph.Namespace.now, (ctx) => {
        return ctx.withValue(new Date("2021-01-01T00:00:00.000Z"));
      }),
    ],
  });

  const query = client.Graph.sub.now;
  const [queryDef, variables] = queryToJson(query);
  const res = await engine.run(queryDef, variables);
  assertEquals(res instanceof Date, true);
  assertEquals((res as Date).toISOString(), "2021-01-01T00:00:00.000Z");
});

Deno.test("Fail if output is not a date", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph, graph.Namespace),
      resolver(graph.Namespace.now, (ctx) => {
        return ctx.withValue(42);
      }),
    ],
  });

  const query = client.Graph.sub.now;
  assertType<IsExact<typeof query, TQueryBase<Date>>>(true);
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "Value is not a Date at builtin.Date",
  );
});

Deno.test("Date input", async (t) => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph, graph.Namespace),
      resolver(graph.Namespace.doStuff.return, (ctx) => {
        const [date] = ctx.getInputOrFail(graph.Namespace.doStuff);
        return ctx.withValue<string>(date.toISOString());
      }),
    ],
  });

  await t.step("Parse Date input", async () => {
    const query = client.Graph.sub.doStuff(
      new Date("2021-01-01T00:00:00.000Z"),
    );
    const [queryDef, variables] = queryToJson(query);
    const res = await engine.run(queryDef, variables);
    assertEquals(res, "2021-01-01T00:00:00.000Z");
  });

  await t.step("Fail if input is not a date", async () => {
    const query = client.Graph.sub.doStuff(42 as any);
    const [queryDef, variables] = queryToJson(query);
    const err = await assertRejects(() => engine.run(queryDef, variables));
    assertEquals(
      (err as Error).message,
      "Invalid arguments passed to root.Namespace.doStuff",
    );
  });
});
