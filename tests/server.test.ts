import { assertExists } from "@std/assert";
import { resolve } from "@std/path";
import { createEngine, parseSchema, resolver } from "../server.ts";
import type { TodoListTypes } from "./schemas/types.ts";

Deno.test("parseSchema", async () => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );

  assertExists(schema);
});

Deno.test("engine", () => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );

  const engine = createEngine({
    schema,
    resolvers: [
      resolver(schema.ref.Graph.config.env.version, (ctx) => ctx.withValue(1)),
      resolver(
        schema.ref.Graph.config._(schema.ref.Config.env.version),
        (ctx) => ctx.withValue(1),
      ),
      resolver(schema.ref.Config.env.version, (ctx) => ctx.withValue(2)),
    ],
  });

  assertExists(engine);
});

// import {
//   type InterfaceDeclaration,
//   Node,
//   Project,
//   ResolutionHosts,
//   type TypeAliasDeclaration,
// } from "ts_morph";

// const project = new Project({
//   resolutionHost: ResolutionHosts.deno,
// });

// project.addSourceFilesAtPaths("example/schemas/todolist.ts");

// const ENTRY_NAMES = "Graph";

// const file = project.getSourceFileOrThrow("example/schemas/todolist.ts");

// const rootDeclarations: Record<
//   string,
//   InterfaceDeclaration | TypeAliasDeclaration
// > = {};

// for (const [name, declarations] of file.getExportedDeclarations()) {
//   if (declarations.length !== 1) {
//     throw new Error("Expected only one declaration");
//   }
//   const declaration = declarations[0];
//   if (
//     Node.isInterfaceDeclaration(declaration) ||
//     Node.isTypeAliasDeclaration(declaration)
//   ) {
//     rootDeclarations[name] = declaration;
//   }
// }

// const entryDeclaration = rootDeclarations[ENTRY_NAMES];

// if (!entryDeclaration) {
//   throw new Error(`Could not find entry declaration: ${ENTRY_NAMES}`);
// }

// console.log(entryDeclaration);
