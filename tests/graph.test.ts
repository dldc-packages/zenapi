import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { assertSnapshot } from "@std/testing/snapshot";
import { parseSchema, type TStructureObject } from "../server.ts";
import { PATH } from "../src/server/constants.ts";
import type { BasicTypes } from "./schemas/basic.types.ts";

const schema = parseSchema<BasicTypes>(resolve("./tests/schemas/basic.ts"));

Deno.test("snapshot structure", async (test) => {
  await assertSnapshot(test, schema.structure);
});

Deno.test("schema.ref.User.age", () => {
  const p1 = schema.graph.User.age;
  const path = p1[PATH];
  const userAgeStructure =
    (schema.structure.types.User as TStructureObject).properties.find((p) =>
      p.name === "age"
    )!.structure;
  assertEquals(path, [userAgeStructure]);
});

Deno.test("schema.ref.User.group", () => {
  const p2 = schema.graph.User.group;
  const path = p2[PATH];
  const userGroupStructure =
    (schema.structure.types.User as TStructureObject).properties.find((p) =>
      p.name === "group"
    )!.structure;
  assertEquals(path, [userGroupStructure]);
});

Deno.test("schema.ref.User.group.name", () => {
  const p3 = schema.graph.User.group.name;
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

Deno.test("schema.ref.User.group.users.items.group", () => {
  const p4 = schema.graph.Graph.user.group.users.items.group;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "Graph.user.ref",
    "User.group.ref",
    "Group.users.array.ref",
    "User.group.ref",
  ]);
});

// Deno.test("Simple graph", () => {
//   const p4 = schema.ref.User.group.users.items.group;
//   assertEquals(p4[PATH], [
//     userGroupStructure,
//     groupUserStructure,
//     userGroupStructure,
//   ]);
// });
