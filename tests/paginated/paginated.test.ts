import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../../client.ts";
import { createEngine, parse, resolver } from "../../server.ts";
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

const schema = parse<AllTypes>(
  resolve("./tests/paginated/graph.ts"),
);

const client = query<AllTypes>();

const g = schema.graph;

Deno.test("Resolve paginated", async () => {
  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [
      resolver(g.Namespace.listStuff.return.return, (ctx) => {
        const [search] = ctx.getInputOrFail(g.Namespace.listStuff);
        assertEquals(search, "hello");
        const [pageConfig] = ctx.getInputOrFail(g.Paginated);
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
