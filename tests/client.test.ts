import { assertEquals } from "@std/assert";
import { obj, queryBuilder, queryToJson } from "../client.ts";
import type { TodoListTypes } from "./schemas/types.ts";

const client = queryBuilder<TodoListTypes>();

Deno.test("simple query", () => {
  const query = client.Graph.config.env.version;
  assertEquals(queryToJson(query), {
    kind: "absolute",
    path: ["Graph", "config", "env", "version"],
  });
});

Deno.test("simple nested query", () => {
  const query = client.Graph._((e) => e.config.env.version);
  assertEquals(queryToJson(query), {
    kind: "absolute",
    path: ["Graph"],
    _: {
      kind: "relative",
      path: ["config", "env", "version"],
    },
  });
});

Deno.test("query with absolute select", () => {
  const query = client.Graph.config._(client.Config.env.version);
  assertEquals(queryToJson(query), {
    kind: "absolute",
    path: ["Graph", "config"],
    _: {
      kind: "absolute",
      path: ["Config", "env", "version"],
    },
  });
});

Deno.test("query with nested absolute select", () => {
  const query = client.Graph.config._(
    client.Config._((c) => obj({ env: c.env.version })),
  );
  assertEquals(queryToJson(query), {
    kind: "absolute",
    path: ["Graph", "config"],
    _: {
      kind: "absolute",
      path: ["Config"],
      _: {
        kind: "object",
        data: { env: { kind: "relative", path: ["env", "version"] } },
      },
    },
  });
});

Deno.test("root object query", () => {
  const query = obj({
    versaion1: client.Graph.config.env.version,
    version2: client.Graph.config.env.version,
  });

  assertEquals(queryToJson(query), {
    kind: "object",
    data: {
      versaion1: {
        kind: "absolute",
        path: ["Graph", "config", "env", "version"],
      },
      version2: {
        kind: "absolute",
        path: ["Graph", "config", "env", "version"],
      },
    },
  });
});
