import type { MyBuiltin } from "./builtins.ts";

export interface Graph {
  now: MyBuiltin;
  doStuff: (date: MyBuiltin) => string;
}
