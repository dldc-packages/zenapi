import type { TTypesBase } from "../utils/types.ts";
import { GET, GRAPH_KEY, GRAPH_PATH, ROOT, SCHEMA } from "./constants.ts";
import type { TSchemaAny } from "./parseSchema.ts";
import type { TGraphPath, TGraphRefBase, TGraphRefOf } from "./types.ts";

export function schemaRef<Types extends TTypesBase>(
  schema: TSchemaAny,
): TGraphRefOf<Types> {
  return proxy(schema, []);
}

export function unwrapSchemaRef(
  ref: TGraphRefBase,
): { path: TGraphPath; schema: TSchemaAny } {
  return {
    path: ref[GRAPH_PATH],
    schema: ref[SCHEMA],
  };
}

function proxy(schema: TSchemaAny, path: TGraphPath): any {
  const cache = new Map<string, any>();
  let key: null | symbol = null;

  function get(prop: string | number) {
    if (cache.has(prop as string)) {
      return cache.get(prop as string);
    }
    const value = proxy(schema, [...path, prop]);
    cache.set(prop as string, value);
    return value;
  }

  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === GRAPH_PATH) {
          return path;
        }
        if (prop === SCHEMA) {
          return schema;
        }
        if (prop === GET) {
          return get;
        }
        if (prop === GRAPH_KEY) {
          if (key) {
            return key;
          }
          if (path.includes(ROOT)) {
            throw new Error("Cannot get GRAPH_KEY for composite path");
          }
          key = Symbol(path.join("."));
          return key;
        }
        if (prop === "_") {
          return (sub: any) => {
            const { path: subPath, schema: subSchema } = unwrapSchemaRef(sub);
            if (subSchema !== schema) {
              throw new Error(
                `Resolver for ${
                  subPath.join(".")
                } is linked to a different schema.`,
              );
            }
            return proxy(schema, [...path, ROOT, ...subPath]);
          };
        }
        if (typeof prop === "symbol") {
          throw new Error(`Unsupported symbol property: ${String(prop)}`);
        }
        return get(prop);
      },
    },
  );
}
