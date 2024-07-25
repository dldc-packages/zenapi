import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { parse, REF } from "../../server.ts";
import { GET, PATH } from "../../src/server/constants.ts";
import type { BaseFn, Graph, Paginated, TodoItem } from "./graph.ts";

export interface AllTypes {
  Graph: Graph;
  Paginated: Paginated<any>;
  TodoItem: TodoItem;
  BaseFn: BaseFn<any>;
}

const schema = parse<AllTypes>(
  resolve("./tests/generics/graph.ts"),
);

const g = schema.graph;

Deno.test("Simple Generic", () => {
  const p1 = g.Graph.todos;
  assertEquals(p1[PATH].map((p) => `${p.key}(${p.kind})`), [
    "Graph.todos(ref)",
  ]);
  const p2 = p1[GET](REF);
  assertEquals(p2[PATH].map((p) => `${p.key}(${p.kind})`), [
    "Graph.todos(ref)",
    "Paginated(interface)",
  ]);
});

Deno.test("Nested generic", () => {
  const p1 = g.Graph.nested;
  assertEquals(p1[PATH].map((p) => `${p.key}(${p.kind})`), [
    "Graph.nested(ref)",
  ]);
  const p2 = p1[GET](REF);
  assertEquals(p2[PATH].map((p) => `${p.key}(${p.kind})`), [
    "Graph.nested(ref)",
    "BaseFn(alias)",
  ]);
  const p3 = p1.return;
  assertEquals(p3[PATH].map((p) => `${p.key}(${p.kind})`), [
    "Graph.nested(ref)",
    "BaseFn.type.returns(ref)",
  ]);
  const p4 = p3[GET](REF);
  assertEquals(p4[PATH].map((p) => `${p.key}(${p.kind})`), [
    "Graph.nested(ref)",
    "BaseFn.type.returns(ref)",
    "TodoItem(interface)",
  ]);
});
