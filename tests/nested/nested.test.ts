import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { obj, query, queryToJson } from "../../client.ts";
import { ApiContext, createEngine, parse, resolver } from "../../server.ts";
import { createCache } from "../utils/graphCache.ts";
import { createMemoryDb } from "../utils/memoryDb.ts";
import type { Family, Graph, Member } from "./graph.ts";

interface AllTypes {
  Graph: Graph;
  Family: Family;
  Member: Member;
}

const graph = parse<AllTypes>(
  resolve("./tests/nested/graph.ts"),
);

const client = query<AllTypes>();

interface TMemberDbItem {
  id: string;
  name: string;
  familyId: string;
}

interface TFamilyDbItem {
  id: string;
  name: string;
  memberIds: string[];
}

const db = createMemoryDb<{
  member: TMemberDbItem;
  family: TFamilyDbItem;
}>({
  family: {
    "f1": { id: "f1", name: "Smith", memberIds: ["m1", "m2"] },
    "f2": { id: "f2", name: "Doe", memberIds: ["m3"] },
  },
  member: {
    "m1": { id: "m1", name: "John", familyId: "f1" },
    "m2": { id: "m2", name: "Jane", familyId: "f2" },
    "m3": { id: "m3", name: "Alice", familyId: "f1" },
  },
});

const MemberCache = createCache("Member", (id: string) => db.get("member", id));
const FamilyCache = createCache("Family", (id: string) => db.get("family", id));

Deno.test("Resolve basic list", async () => {
  const membersResolver = resolver(
    graph.Graph.members,
    (ctx) => {
      const members = db.list("member");
      return ctx.withValue(members);
    },
  );

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [membersResolver],
  });

  const query = client.Graph.members._(({ id, name }) => obj({ id, name }));
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(
    result,
    [
      { id: "m1", name: "John" },
      { id: "m2", name: "Jane" },
      { id: "m3", name: "Alice" },
    ],
  );
});

Deno.test("Resolve computed property", async () => {
  const membersResolver = resolver(
    graph.Graph.members,
    (ctx) => {
      const members = db.list("member");
      return ctx.withValue(
        members.map((member) =>
          ApiContext.empty().with(MemberCache.provideValue(member))
            .withValue(member)
        ),
      );
    },
  );

  const memberNameUpperResolver = resolver(
    graph.Member.nameUpper,
    (ctx) => {
      const member = MemberCache.getOrFail(ctx);
      return ctx.withValue(member.name.toUpperCase());
    },
  );

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [membersResolver, memberNameUpperResolver],
  });

  db.clearOps();
  const query = client.Graph.members._(({ id, name, nameUpper }) =>
    obj({ id, name, nameUpper })
  );
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(
    result,
    [
      { id: "m1", name: "John", nameUpper: "JOHN" },
      { id: "m2", name: "Jane", nameUpper: "JANE" },
      { id: "m3", name: "Alice", nameUpper: "ALICE" },
    ],
  );
  assertEquals(db.ops(), ["list member"]);
});

Deno.test("Resolve computed property using getter", async () => {
  const membersResolver = resolver(
    graph.Graph.members,
    (ctx) => {
      const members = db.list("member");
      return ctx.withValue(
        members.map((member) =>
          ApiContext.empty().map(MemberCache.provideLoader(member.id))
            .withValue(member)
        ),
      );
    },
  );

  const memberNameUpperResolver = resolver(
    graph.Member.nameUpper,
    (ctx) => {
      const member = MemberCache.getOrFail(ctx);
      return ctx.withValue(member.name.toUpperCase());
    },
  );

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [membersResolver, memberNameUpperResolver],
  });

  db.clearOps();
  const query = client.Graph.members._(({ id, name, nameUpper }) =>
    obj({ id, name, nameUpper, nameUpper2: nameUpper })
  );
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(
    result,
    [
      { id: "m1", name: "John", nameUpper: "JOHN", nameUpper2: "JOHN" },
      { id: "m2", name: "Jane", nameUpper: "JANE", nameUpper2: "JANE" },
      { id: "m3", name: "Alice", nameUpper: "ALICE", nameUpper2: "ALICE" },
    ],
  );
  assertEquals(db.ops(), [
    "list member",
    "get member m1",
    "get member m2",
    "get member m3",
  ]);
});

Deno.test("Resolve family of member", async () => {
  const membersResolver = resolver(
    graph.Graph.members,
    (ctx) => {
      const members = db.list("member");
      return ctx.withValue(
        members.map((member) =>
          ApiContext.empty().map(MemberCache.provideLoader(member.id))
            .withValue(member)
        ),
      );
    },
  );

  const memberFamilyResolver = resolver(
    graph.Member.family,
    (ctx) => {
      const member = MemberCache.getOrFail(ctx);
      return ctx.map(FamilyCache.provideLoader(member.familyId));
    },
  );

  const familyResolver = resolver(
    graph.Family,
    (ctx) => {
      const family = FamilyCache.getOrFail(ctx);
      return ctx.withValue(family);
    },
  );

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [membersResolver, memberFamilyResolver, familyResolver],
  });

  db.clearOps();
  const query = client.Graph.members._(({ id, name, family }) =>
    obj({ id, name, familyName: family.name })
  );
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(
    result,
    [
      { id: "m1", name: "John", familyName: "Smith" },
      { id: "m2", name: "Jane", familyName: "Doe" },
      { id: "m3", name: "Alice", familyName: "Smith" },
    ],
  );
  assertEquals(db.ops(), [
    "list member",
    "get member m1",
    "get member m2",
    "get member m3",
    "get family f1",
    "get family f2",
    "get family f1",
  ]);
});

Deno.test("Resolve member -> family -> member", async () => {
  const membersResolver = resolver(
    graph.Graph.members,
    (ctx) => {
      const members = db.list("member");
      return ctx.withValue(
        members.map((member) =>
          ApiContext.empty().map(MemberCache.provideLoader(member.id))
            .withValue(member)
        ),
      );
    },
  );

  const memberFamilyResolver = resolver(
    graph.Member.family,
    (ctx) => {
      const member = MemberCache.getOrFail(ctx);
      return ctx.map(FamilyCache.provideLoader(member.familyId));
    },
  );

  const familyResolver = resolver(
    graph.Family,
    (ctx) => {
      const family = FamilyCache.getOrFail(ctx);
      return ctx.withValue(family);
    },
  );

  const familyMembersResolver = resolver(
    graph.Family.members,
    (ctx) => {
      const family = FamilyCache.getOrFail(ctx);
      return ctx.withValue(
        family.memberIds.map((id) =>
          ApiContext.empty().map(MemberCache.provideLoader(id))
        ),
      );
    },
  );

  const memberResolver = resolver(
    graph.Member,
    (ctx) => {
      const member = MemberCache.getOrFail(ctx);
      return ctx.withValue(member);
    },
  );

  const engine = createEngine({
    graph,
    entry: "Graph",
    resolvers: [
      membersResolver,
      memberFamilyResolver,
      familyResolver,
      familyMembersResolver,
      memberResolver,
    ],
  });

  const query = client.Graph.members._(({ id, name, family }) =>
    obj({
      id,
      name,
      familyMembers: family.members._(({ name }) => obj({ name })),
    })
  );
  const [queryDef, variables] = queryToJson(query);
  const result = await engine.run(queryDef, variables);
  assertEquals(
    result,
    [
      {
        familyMembers: [{ name: "John" }, { name: "Jane" }],
        id: "m1",
        name: "John",
      },
      {
        familyMembers: [{ name: "Alice" }],
        id: "m2",
        name: "Jane",
      },
      {
        familyMembers: [{ name: "John" }, { name: "Jane" }],
        id: "m3",
        name: "Alice",
      },
    ],
  );
});
