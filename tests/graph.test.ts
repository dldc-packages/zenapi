import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { assertSnapshot } from "@std/testing/snapshot";
import { parse, type TGraphBase, type TStructureInterface } from "../server.ts";
import { PATH, REF, ROOT } from "../src/server/constants.ts";
import type { BasicTypes } from "./schemas/basic.types.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

Deno.test("todolist snapshot structure", async (test) => {
  const graph = parse<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );
  await assertSnapshot(test, graph[ROOT]);
});

const graph = parse<BasicTypes>(resolve("./tests/schemas/basic.ts"));

Deno.test("snapshot structure", async (test) => {
  await assertSnapshot(test, graph[ROOT]);
});

Deno.test("g.User.age", () => {
  const p1 = graph.User.age;
  const path = p1[PATH];
  const userStructure = graph[ROOT].types.find((t) =>
    t.name === "User"
  )! as TStructureInterface;
  const userAgeStructure =
    userStructure.properties.find((p) => p.name === "age")!.structure;
  assertEquals(path, [userAgeStructure]);
});

Deno.test("g.User.group", () => {
  const p2 = graph.User.group;
  const path = p2[PATH];
  const userStructure = graph[ROOT].types.find((t) =>
    t.name === "User"
  )! as TStructureInterface;
  const userGroupStructure =
    userStructure.properties.find((p) => p.name === "group")!.structure;
  assertEquals(path, [userGroupStructure]);
});

Deno.test("g.User.group.name", () => {
  const p3 = graph.User.group.name;
  const path = p3[PATH];
  const userStructure = graph[ROOT].types.find((t) =>
    t.name === "User"
  )! as TStructureInterface;
  const userGroupStructure =
    userStructure.properties.find((p) => p.name === "group")!.structure;
  const groupStructure = graph[ROOT].types.find((t) =>
    t.name === "Group"
  )! as TStructureInterface;
  const groupNameStructure =
    groupStructure.properties.find((p) => p.name === "name")!.structure;
  assertEquals(path, [userGroupStructure, groupNameStructure]);
});

Deno.test("g.Graph.user", () => {
  const p4 = graph.Graph.user;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.Graph.user",
  ]);
});

Deno.test("g.Graph.user[REF]", () => {
  const p4 = graph.Graph.user[REF];
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.Graph.user",
    "root.User",
  ]);
});

Deno.test("g.Graph.user.group", () => {
  const p4 = graph.Graph.user.group;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.Graph.user",
    "root.User.group",
  ]);
});
Deno.test("g.User.group.users.items.group", () => {
  const p4 = graph.Graph.user.group.users.items.group;
  const path = p4[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.Graph.user",
    "root.User.group",
    "root.Group.users.items",
    "root.User.group",
  ]);
});

Deno.test("g.User.maybeGroup", () => {
  const p = graph.User.maybeGroup;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.User.maybeGroup",
  ]);
});

Deno.test("g.User.maybeGroup._(g.Group)", () => {
  const p = graph.User.maybeGroup.name;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.User.maybeGroup.type",
    "root.Group.name",
  ]);
});

Deno.test("g.User.maybeGroup._(g.Group).name", () => {
  const p = graph.Graph.randomItem._(graph.Group).name;
  const path = p[PATH];
  assertEquals(path.map((p) => p.key), [
    "root.Graph.randomItem",
    "root.Group.name",
  ]);
});

Deno.test("matrix", async (t) => {
  const CASES: { graph: TGraphBase<any>; result: string[] }[] = [
    { graph: graph.User.age, result: ["root.User.age"] },
    { graph: graph.User.group, result: ["root.User.group"] },
    {
      graph: graph.User.group.name,
      result: ["root.User.group", "root.Group.name"],
    },
    { graph: graph.Graph.user[REF], result: ["root.Graph.user", "root.User"] },
    {
      graph: graph.Graph.user.group,
      result: ["root.Graph.user", "root.User.group"],
    },
    {
      graph: graph.Graph.user.group.users.items.group,
      result: [
        "root.Graph.user",
        "root.User.group",
        "root.Group.users.items",
        "root.User.group",
      ],
    },
    { graph: graph.User.maybeGroup, result: ["root.User.maybeGroup"] },
    {
      graph: graph.User.maybeGroup.name,
      result: ["root.User.maybeGroup.type", "root.Group.name"],
    },
    {
      graph: graph.User.maybeGroup[REF],
      result: ["root.User.maybeGroup.type"],
    },
    {
      graph: graph.User.maybeGroup[REF][REF],
      result: ["root.User.maybeGroup.type", "root.Group"],
    },
  ];

  for (const { graph, result } of CASES) {
    const name = result.join(" > ");
    await t.step(name, () => {
      assertEquals(graph[PATH].map((p) => p.key), result);
    });
  }
});

Deno.test("Deno.inspect matrix", async (t) => {
  const CASES: { graph: TGraphBase<any>; path: string; name: string }[] = [
    {
      graph: graph.User.age,
      path: "Graph(root.User.age)",
      name: "root.User.age",
    },
    {
      graph: graph.User.group,
      path: "Graph(root.User.group)",
      name: "root.User.group",
    },
    {
      graph: graph.User.group.name,
      path: "Graph(root.User.group/root.Group.name)",
      name: "root.Group.name",
    },
    {
      graph: graph.Graph.user[REF],
      path: "Graph(root.Graph.user/root.User)",
      name: "root.User",
    },
    {
      graph: graph.Graph.user.group,
      path: "Graph(root.Graph.user/root.User.group)",
      name: "root.User.group",
    },
    {
      graph: graph.Graph.user.group.users.items.group,
      path:
        "Graph(root.Graph.user/root.User.group/root.Group.users.items/root.User.group)",
      name: "root.User.group",
    },
    {
      graph: graph.User.maybeGroup,
      path: "Graph(root.User.maybeGroup)",
      name: "root.User.maybeGroup",
    },
    {
      graph: graph.User.maybeGroup.name,
      path: "Graph(root.User.maybeGroup.type/root.Group.name)",
      name: "root.Group.name",
    },
    {
      graph: graph.User.maybeGroup[REF],
      path: "Graph(root.User.maybeGroup.type)",
      name: "root.User.maybeGroup.type",
    },
    {
      graph: graph.User.maybeGroup[REF][REF],
      path: "Graph(root.User.maybeGroup.type/root.Group)",
      name: "root.Group",
    },
  ];

  for (const { graph, name, path } of CASES) {
    await t.step(path, () => {
      assertEquals(Deno.inspect(graph), path);
      assertEquals("" + graph, name);
      assertEquals(`${graph}`, name);
    });
  }
});
