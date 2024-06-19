import { assertExists } from "@std/assert";
import { resolve } from "@std/path";
import { parseSchema } from "../server.ts";
import type { TodoListTypes } from "./schemas/todolist.types.ts";

Deno.test("parseSchema", () => {
  const schema = parseSchema<TodoListTypes>(
    resolve("./tests/schemas/todolist.ts"),
  );

  assertExists(schema);
});

// Deno.test("engine", () => {
//   const schema = parseSchema<TodoListTypes>(
//     resolve("./tests/schemas/todolist.ts"),
//   );

//   const engine = createEngine({
//     schema,
//     resolvers: [
//       resolver(schema.ref.Graph.config.env.version, (ctx) => ctx.withValue(1)),
//       resolver(
//         schema.ref.Graph.config._(schema.ref.Config.env.version),
//         (ctx) => ctx.withValue(1),
//       ),
//       resolver(schema.ref.Config.env.version, (ctx) => ctx.withValue(2)),
//     ],
//   });

//   assertExists(engine);
// });
