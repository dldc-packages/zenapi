import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { obj, query, queryToJson } from "../../client.ts";
import {
  createEngine,
  defaultResolver,
  parse,
  resolver,
} from "../../server.ts";
import type {
  Graph,
  Namespace,
  PageConfig,
  Paginated,
  PaginatedResult,
  Stuff,
} from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  Namespace: Namespace;
  Stuff: Stuff;
  PageConfig: PageConfig;
  Paginated: Paginated<unknown>;
  PaginatedResult: PaginatedResult<unknown>;
}

const graph = parse<AllTypes>(
  resolve("./tests/paginated/graph.ts"),
);

const client = query<AllTypes>();

Deno.test("Resolve paginated", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph, graph.Namespace),
      resolver(graph.Namespace.listStuff.return.return, (ctx) => {
        const [search] = ctx.getInputOrFail(graph.Namespace.listStuff);
        assertEquals(search, "hello");
        const [pageConfig] = ctx.getInputOrFail(graph.Paginated);
        assertEquals(pageConfig, { page: 2 });
        return ctx.withValue({
          data: [{ data: "hello", num: 42 }],
          total: 1,
        });
      }),
    ],
  });

  const query = client.Graph.sub.listStuff("hello")({ page: 2 }).data._((s) =>
    s.num
  );
  const [queryDef, variables] = queryToJson(query);
  const res = await engine.run(queryDef, variables);
  assertEquals(res, [42]);
});

Deno.test("Resolve paginated items", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      ...defaultResolver(graph.Graph, graph.Namespace),
      resolver(graph.Namespace.listStuff.return.return, (ctx) => {
        const [search] = ctx.getInputOrFail(graph.Namespace.listStuff);
        assertEquals(search, "hello");
        const [pageConfig] = ctx.getInputOrFail(graph.Paginated);
        assertEquals(pageConfig, { page: 2 });
        return ctx.withValue({
          data: [{}],
          total: 1,
        });
      }),
      resolver(graph.Stuff, (ctx) => {
        return ctx.withValue<Stuff>({ num: 42, data: "hello" });
      }),
    ],
  });

  const query = client.Graph.sub.listStuff("hello")({ page: 2 }).data._((
    { data, num },
  ) => obj({ data, num }));
  const [queryDef, variables] = queryToJson(query);
  const res = await engine.run(queryDef, variables);
  assertEquals(res, [{ num: 42, data: "hello" }]);
});
