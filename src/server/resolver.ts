import type { TGraphBaseAny } from "./graph.ts";
import type { TMiddleware } from "./types.ts";

export interface TResolver {
  kind: "resolver";
  path: TGraphBaseAny;
  middlewares: TMiddleware[];
}

export function resolver(
  path: TGraphBaseAny,
  ...resolvers: TMiddleware[]
): TResolver {
  return { kind: "resolver", path, middlewares: resolvers };
}
