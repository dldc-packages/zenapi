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

const graph = parse<AllTypes>(
  resolve("./tests/generics/graph.ts"),
);

Deno.test("Simple Generic", () => {
  const p1 = graph.Graph.todos;
  assertEquals(p1[PATH].map((p) => `${p.key}(${p.kind})`), [
    "root.Graph.todos(ref)",
  ]);
  const p2 = p1[GET](REF);
  assertEquals(p2[PATH].map((p) => `${p.key}(${p.kind})`), [
    "root.Graph.todos(ref)",
    "root.Paginated(interface)",
  ]);
});

Deno.test("Nested generic", () => {
  const p1 = graph.Graph.nested;
  assertEquals(p1[PATH].map((p) => `${p.key}(${p.kind})`), [
    "root.Graph.nested(ref)",
  ]);
  const p2 = p1[GET](REF);
  assertEquals(p2[PATH].map((p) => `${p.key}(${p.kind})`), [
    "root.Graph.nested(ref)",
    "root.BaseFn(alias)",
  ]);
  const p3 = p1.return;
  assertEquals(p3[PATH].map((p) => `${p.key}(${p.kind})`), [
    "root.Graph.nested(ref)",
    "root.BaseFn.type.returns(ref)",
  ]);
  const p4 = p3[GET](REF);
  assertEquals(p4[PATH].map((p) => `${p.key}(${p.kind})`), [
    "root.Graph.nested(ref)",
    "root.BaseFn.type.returns(ref)",
    "root.TodoItem(interface)",
  ]);
});
