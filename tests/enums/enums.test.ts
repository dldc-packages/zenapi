import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { query, queryToJson } from "../../client.ts";
import { createEngine, parse, resolver } from "../../server.ts";
import type { Graph, UserRole } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  UserRole: UserRole;
}

const schema = parse<AllTypes>(
  resolve("./tests/enums/graph.ts"),
);

const client = query<AllTypes>();

const g = schema.graph;

// Deno.test("Properly parse schema", () => {
//   const roleStruct = schema.structure.types.find((s) => s.name === "UserRole");

//   assertEquals(roleStruct, {
//     "kind": "alias",
//     "key": "UserRole",
//     "name": "UserRole",
//     "type": {
//       "kind": "union",
//       "key": "UserRole",
//       "types": [
//         { "kind": "literal", "key": "UserRole.0", "type": "admin" },
//         { "kind": "literal", "key": "UserRole.1", "type": "user" },
//         { "kind": "literal", "key": "UserRole.2", "type": "guest" },
//       ],
//     },
//     "parameters": [],
//   });
// });

// Deno.test("Resolve enum union", async () => {
//   const engine = createEngine({
//     schema,
//     entry: "Graph",
//     resolvers: [resolver(g.Graph.role, (ctx) => ctx.withValue("admin"))],
//   });

//   const query = client.Graph.role;
//   const [queryDef, variables] = queryToJson(query);
//   const result = await engine.run(queryDef, variables);
//   assertEquals(result, "admin");
// });

Deno.test("Fail with invalid value", async () => {
  const engine = createEngine({
    schema,
    entry: "Graph",
    resolvers: [resolver(g.Graph.role, (ctx) => ctx.withValue("yolo"))],
  });

  const query = client.Graph.role;
  const [queryDef, variables] = queryToJson(query);
  const err = await assertRejects(() => engine.run(queryDef, variables));
  assertEquals((err as Error).message, "Invalid query");
});
