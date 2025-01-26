import type { TTypesBase } from "../utils/types.ts";
import { GET, PATH, REF, ROOT, STRUCTURE, type TYPES } from "./constants.ts";
import { getStructureProp } from "./getGraphProp.ts";
import type { TAllStructure, TRootStructure } from "./structure.types.ts";
import type { TGraphOf, TLocalTypes } from "./types.ts";

export type TGraphBaseAny = TGraphBase<any>;

export type TGraphGet = (
  prop: string | number | symbol | TAllStructure,
) => TGraphBaseAny;

export interface TGraphBase<Input> {
  [TYPES]: { input: Input };
  [ROOT]: TRootStructure;
  [STRUCTURE]: TAllStructure;
  // This is a list of all leaf structures in the path.
  [PATH]: TAllStructure[];
  [GET]: TGraphGet;
  // Shortcut to [GET](REF)
  [REF]: TGraphBaseAny;
  [Symbol.toStringTag]: () => string;
  _<T extends TGraphBaseAny>(next: T): T;
}

export function graph<Types extends TTypesBase>(
  rootStructure: TRootStructure,
): TGraphOf<Types, never> {
  return graphInternal({
    rootStructure,
    localTypes: {},
    path: [rootStructure],
  }) as TGraphOf<Types, never>;
}

export interface TGraphInternalParams {
  rootStructure: TRootStructure;
  localTypes: TLocalTypes;
  path: TAllStructure[];
}

export type TGraphCacheKey = string | number | symbol | TAllStructure;
export type TGraphCache = Map<TGraphCacheKey, TGraphBaseAny>;

export function graphInternal(
  { rootStructure, localTypes, path }: TGraphInternalParams,
): TGraphBaseAny {
  const cache: TGraphCache = new Map();
  const structure = path[path.length - 1];

  function get(
    prop: string | number | symbol | TAllStructure,
  ): TGraphBaseAny {
    if (path.length > 10) {
      throw new Error("Path too deep");
    }
    if (cache.has(prop)) {
      return cache.get(prop)!;
    }
    const result = getStructureProp({
      rootStructure,
      localTypes,
      path,
      structure,
      prop,
      get,
    });
    cache.set(prop, result);
    return result;
  }

  return new Proxy(
    {
      [Symbol.for("Deno.customInspect")]() {
        return `Graph(${path.map((p) => p.key).join("/")})`;
      },
      [Symbol.toStringTag]() {
        return structure.key;
      },
      [Symbol.toPrimitive]() {
        return structure.key;
      },
    } as any,
    {
      get(target, prop, receiver) {
        const targetProps = Reflect.get(target, prop, receiver);
        if (targetProps) {
          return targetProps;
        }
        if (prop === PATH) {
          return path;
        }
        if (prop === STRUCTURE) {
          return structure;
        }
        if (prop === GET) {
          return get;
        }
        if (prop === REF) {
          return get(REF);
        }
        if (prop === ROOT) {
          return rootStructure;
        }
        if (prop === "_") {
          return (sub: TGraphBaseAny) => {
            const [base, ...rest] = sub[PATH];
            if (!base) {
              throw new Error("Invalid path");
            }
            if (rest.length > 0) {
              throw new Error("_() expect a top level type");
            }
            return get(base);
            // for (const prop of rest) {
            //   result = result[GET](prop, true);
            // }
          };
        }
        return get(prop);
      },
    },
  ) as TGraphBaseAny;
}

/**
 * Check if the path of item match the end of the base path.
 */
export function graphMatch(base: TGraphBaseAny, item: TGraphBaseAny): boolean {
  const basePathRereved = base[PATH].slice().reverse();
  const itemPathRereved = item[PATH].slice().reverse();
  if (basePathRereved.length < itemPathRereved.length) {
    return false;
  }
  return itemPathRereved.every((item, i) => basePathRereved[i] === item);
}
