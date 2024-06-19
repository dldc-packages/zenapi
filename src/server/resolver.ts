import type { TGraphBase } from "./graph.ts";
import type { TMiddleware } from "./types.ts";

export interface TResolver {
  path: TGraphBase;
  middlewares: TMiddleware[];
}

export function resolver(
  path: TGraphBase,
  ...middlewares: TMiddleware[]
): TResolver {
  return { path, middlewares };
}
