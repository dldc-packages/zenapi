import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { assertSnapshot } from "@std/testing/snapshot";
import { parseSchema, type TStructureObject } from "../server.ts";
import { PATH } from "../src/server/constants.ts";
import type { BasicTypes } from "./schemas/basic.types.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

Deno.test("todolist snapshot structure", async (test) => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );
  await assertSnapshot(test, schema.structure);
});

const schema = parseSchema<BasicTypes>(resolve("./tests/schemas/basic.ts"));

const g = schema.graph;

Deno.test("snapshot structure", async (test) => {
  await assertSnapshot(test, schema.structure);
});

Deno.test("g.User.age", () => {
  const p1 = g.User.age;
  const path = p1[PATH];
  const userAgeStructure =
    (schema.structure.types.User as TStructureObject).properties.find((p) =>
      p.name === "age"
    )!.structure;
  assertEquals(path, [userAgeStructure]);
});

Deno.test("g.User.group", () => {
  const p2 = g.User.group;
  const path = p2[PATH];
  const userGroupStructure =
    (schema.structure.types.User as TStructureObject).properties.find((p) =>
      p.name === "group"
    )!.structure;
  assertEquals(path, [userGroupStructure]);
});

Deno.test("g.User.group.name", () => {
  const p3 = g.User.group.name;
  const path = p3[PATH];
  const userGroupStructure =
    (schema.structure.types.User as TStructureObject).properties.find((p) =>
      p.name === "group"
    )!.structure;
  const groupNameStructure =
    (schema.structure.types.Group as TStructureObject).properties.find((p) =>
      p.name === "name"
    )!.structure;
  assertEquals(path, [userGroupStructure, groupNameStructure]);
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
  const p = g.User.maybeGroup._(g.Group);
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "User.maybeGroup",
    "Group",
  ]);
});

Deno.test("g.User.maybeGroup._(g.Group).name", () => {
  const p = g.User.maybeGroup._(g.Group).name;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "User.maybeGroup",
    "Group.name",
  ]);
});

// Deno.test("Simple graph", () => {
//   const p4 = g.User.group.users.items.group;
//   assertEquals(p4[PATH], [
//     userGroupStructure,
//     groupUserStructure,
//     userGroupStructure,
//   ]);
// });
