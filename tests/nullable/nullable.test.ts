import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../../client.ts";
import { createEngine, parse, resolver } from "../../server.ts";
import type {
  Graph,
  Namespace,
  ParamsWithNull,
  SimpleObj,
  SimpleParams,
} from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  Namespace: Namespace;
  ParamsWithNull: ParamsWithNull;
  SimpleObj: SimpleObj;
  SimpleParams: SimpleParams;
}

const graph = parse<AllTypes>(
  resolve("./tests/nullable/graph.ts"),
);

const client = query<AllTypes>();

Deno.test("Nullable input", async (t) => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      resolver(graph.Namespace.execWithParams.return, (ctx) => {
        const [params] = ctx.getInputOrFail(graph.Namespace.execWithParams);
        return ctx.withValue<string>(JSON.stringify([
          params.nullable === null
            ? "null"
            : params.nullable === undefined
            ? "undefined"
            : typeof params.nullable,
          params.optionalNull === null
            ? "null"
            : params.optionalNull === undefined
            ? "undefined"
            : typeof params.optionalNull,
          params.optionalString === null
            ? "null"
            : params.optionalString === undefined
            ? "undefined"
            : typeof params.optionalString,
        ]));
      }),
    ],
  });

  await t.step("all provided", async () => {
    const query = client.Graph.sub.execWithParams({
      nullable: "nullable",
      optionalNull: "optionalNull",
      optionalString: "optionalString",
    });
    const [queryDef, variables] = queryToJson(query);
    const res = await engine.run(queryDef, variables);
    assertEquals(res, `["string","string","string"]`);
  });

  await t.step("null provided", async () => {
    const query = client.Graph.sub.execWithParams({
      nullable: null,
      optionalNull: null,
    });
    const [queryDef, variables] = queryToJson(query);
    const res = await engine.run(queryDef, variables);
    assertEquals(res, `["null","null","undefined"]`);
  });

  await t.step("omit optional nullable", async () => {
    const query = client.Graph.sub.execWithParams({
      nullable: "nullable",
    });
    const [queryDef, variables] = queryToJson(query);
    const res = await engine.run(queryDef, variables);
    assertEquals(res, `["string","undefined","undefined"]`);
  });
});
