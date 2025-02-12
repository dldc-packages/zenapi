import { STRUCTURE } from "./constants.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TAllStructure } from "./structure.types.ts";
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

export function defaultResolver(
  ...paths: TGraphBaseAny[]
): TResolver[] {
  return paths.map((path) => {
    const structure = path[STRUCTURE];
    const defaultValue = getDefaultValueByStructure(structure);
    return resolver(path, async (ctx, next) => {
      const res = await next(ctx);
      if (res.value === undefined) {
        return ctx.withValue(defaultValue);
      }
      return ctx;
    });
  });
}

function getDefaultValueByStructure(
  structure: TAllStructure,
): any {
  switch (structure.kind) {
    case "array":
      return [];
    case "object":
    case "interface":
      return {};
    default:
      throw new Error(`No default value for ${structure.kind}`);
  }
}
