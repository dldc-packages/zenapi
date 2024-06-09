import type { TGraphRefBase, TMiddleware } from "./types.ts";

export interface TResolver {
  ref: TGraphRefBase;
  middlewares: TMiddleware[];
}

export function resolver(
  ref: TGraphRefBase,
  ...middlewares: TMiddleware[]
): TResolver {
  return { ref, middlewares };
}
