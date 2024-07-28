import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../../client.ts";
import { createEngine, parse, resolver } from "../../server.ts";
import { ROOT } from "../../src/server/constants.ts";
import type { Graph, UserRole } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  UserRole: UserRole;
}

const graph = parse<AllTypes>(
  resolve("./tests/enums/graph.ts"),
);

const client = query<AllTypes>();

Deno.test("Properly parse schema", () => {
  const roleStruct = graph[ROOT].types.find((s) => s.name === "UserRole");

  assertEquals(roleStruct, {
    "kind": "alias",
    "key": "root.UserRole",
    "name": "UserRole",
    "type": {
      "kind": "union",
      "key": "root.UserRole.type",
      "types": [
        { "kind": "literal", "key": "root.UserRole.type.0", "type": "admin" },
        { "kind": "literal", "key": "root.UserRole.type.1", "type": "user" },
        { "kind": "literal", "key": "root.UserRole.type.2", "type": "guest" },
      ],
    },
    "parameters": [],
  });
});

Deno.test("Resolve enum union", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [resolver(graph.Graph.role, (ctx) => ctx.withValue("admin"))],
  });

  const query = client.Graph.role;
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(result, "admin");
});

Deno.test("Fail with invalid value", async () => {
  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [resolver(graph.Graph.role, (ctx) => ctx.withValue("yolo"))],
  });

  const query = client.Graph.role;
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals(
    (err as Error).message,
    "No match for union root.UserRole.type, use ctx.withValueType to specify the type",
  );
});
