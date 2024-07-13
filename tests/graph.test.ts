import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { assertSnapshot } from "@std/testing/snapshot";
import { parse, type TGraphBase, type TStructureInterface } from "../server.ts";
import { PATH, REF } from "../src/server/constants.ts";
import type { BasicTypes } from "./schemas/basic.types.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

Deno.test("todolist snapshot structure", async (test) => {
  const schema = parse<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );
  await assertSnapshot(test, schema.structure);
});

const schema = parse<BasicTypes>(resolve("./tests/schemas/basic.ts"));

const g = schema.graph;

Deno.test("snapshot structure", async (test) => {
  await assertSnapshot(test, schema.structure);
});

Deno.test("g.User.age", () => {
  const p1 = g.User.age;
  const path = p1[PATH];
  const userStructure = schema.structure.types.find((t) =>
    t.name === "User"
  )! as TStructureInterface;
  const userAgeStructure =
    userStructure.properties.find((p) => p.name === "age")!.structure;
  assertEquals(path, [userAgeStructure]);
});

Deno.test("g.User.group", () => {
  const p2 = g.User.group;
  const path = p2[PATH];
  const userStructure = schema.structure.types.find((t) =>
    t.name === "User"
  )! as TStructureInterface;
  const userGroupStructure =
    userStructure.properties.find((p) => p.name === "group")!.structure;
  assertEquals(path, [userGroupStructure]);
});

Deno.test("g.User.group.name", () => {
  const p3 = g.User.group.name;
  const path = p3[PATH];
  const userStructure = schema.structure.types.find((t) =>
    t.name === "User"
  )! as TStructureInterface;
  const userGroupStructure =
    userStructure.properties.find((p) => p.name === "group")!.structure;
  const groupStructure = schema.structure.types.find((t) =>
    t.name === "Group"
  )! as TStructureInterface;
  const groupNameStructure =
    groupStructure.properties.find((p) => p.name === "name")!.structure;
  assertEquals(path, [userGroupStructure, groupNameStructure]);
});

Deno.test("g.Graph.user", () => {
  const p4 = g.Graph.user;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "Graph.user",
  ]);
});

Deno.test("g.Graph.user[REF]", () => {
  const p4 = g.Graph.user[REF];
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "Graph.user",
    "User",
  ]);
});

Deno.test("g.Graph.user.group", () => {
  const p4 = g.Graph.user.group;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "Graph.user",
    "User.group",
  ]);
});
Deno.test("g.User.group.users.items.group", () => {
  const p4 = g.Graph.user.group.users.items.group;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "Graph.user",
    "User.group",
    "Group.users.items",
    "User.group",
  ]);
});

Deno.test("g.User.maybeGroup", () => {
  const p = g.User.maybeGroup;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "User.maybeGroup",
  ]);
});

Deno.test("g.User.maybeGroup._(g.Group)", () => {
  const p = g.User.maybeGroup.name;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "User.maybeGroup.type",
    "Group.name",
  ]);
});

Deno.test("g.User.maybeGroup._(g.Group).name", () => {
  const p = g.Graph.randomItem._(g.Group).name;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "Graph.randomItem",
    "Group.name",
  ]);
});

Deno.test("matrix", async (t) => {
  const CASES: { graph: TGraphBase<any>; result: string[] }[] = [
    { graph: g.User.age, result: ["User.age"] },
    { graph: g.User.group, result: ["User.group"] },
    { graph: g.User.group.name, result: ["User.group", "Group.name"] },
    { graph: g.Graph.user[REF], result: ["Graph.user", "User"] },
    { graph: g.Graph.user.group, result: ["Graph.user", "User.group"] },
    {
      graph: g.Graph.user.group.users.items.group,
      result: ["Graph.user", "User.group", "Group.users.items", "User.group"],
    },
    { graph: g.User.maybeGroup, result: ["User.maybeGroup"] },
    {
      graph: g.User.maybeGroup.name,
      result: ["User.maybeGroup.type", "Group.name"],
    },
    {
      graph: g.User.maybeGroup[REF],
      result: ["User.maybeGroup.type"],
    },
    {
      graph: g.User.maybeGroup[REF][REF],
      result: ["User.maybeGroup.type", "Group"],
    },
  ];

  for (const { graph, result } of CASES) {
    const name = result.join(" > ");
    await t.step(name, () => {
      assertEquals(graph[PATH].map((p) => p.key), result);
    });
  }
});
