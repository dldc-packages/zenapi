import type { TTypesBase } from "../utils/types.ts";
import { GET, PATH, ROOT, STRUCTURE } from "./constants.ts";
import { getStructureProp, type TGetStructurePropResult } from "./structure.ts";
import type { TAllStructure, TRootStructure } from "./structure.types.ts";
import type { TGraphOf } from "./types.ts";

export interface TGraphBase {
  [ROOT]: TRootStructure;
  [STRUCTURE]: TAllStructure;
  // This is a list of all leaf structures in the path.
  [PATH]: TAllStructure[];
  [GET]: (
    prop: string | number | TAllStructure,
    skipValidation?: boolean,
  ) => TGraphBase;
  _<T extends TGraphBase>(next: T): T;
}

export function graph<Types extends TTypesBase>(
  rootStructure: TRootStructure,
): TGraphOf<Types> {
  return proxy(rootStructure, []) as TGraphOf<Types>;
}

function proxy(
  rootStructure: TRootStructure,
  path: TAllStructure[],
): TGraphBase {
  const cache = new WeakMap<TAllStructure, TGraphBase>();
  const structure = path.length === 0 ? rootStructure : path[path.length - 1];

  function get(
    prop: string | number | TAllStructure,
    skipValidation = false,
  ): TGraphBase {
    const { structure: nextStructure, isRoot } = getNextStructure(
      prop,
      skipValidation,
    );
    if (cache.has(nextStructure)) {
      return cache.get(nextStructure)!;
    }
    const nextPath: TAllStructure[] = isRoot ? [...path] : path.slice(0, -1);
    nextPath.push(nextStructure);
    const result = proxy(rootStructure, nextPath);
    cache.set(nextStructure, result);
    return result;
  }

  function getNextStructure(
    prop: string | number | TAllStructure,
    skipValidation: boolean,
  ): TGetStructurePropResult {
    if (typeof prop === "string" || typeof prop === "number") {
      return getStructureProp(rootStructure, structure, prop);
    }
    if (skipValidation) {
      return { structure: prop, isRoot: true };
    }
    return {
      structure: validateNextStructureByRef(prop),
      isRoot: true,
    };
  }

  function validateNextStructureByRef(prop: TAllStructure): TAllStructure {
    if (structure.kind === "ref") {
      // prop is epxected to be the matching ref
      const { structure: refStructure } = getStructureProp(
        rootStructure,
        rootStructure,
        structure.ref,
      );
      if (prop !== refStructure) {
        throw new Error(
          `Invalid path: expected ${structure.ref} but got ${refStructure.kind}`,
        );
      }
      return prop;
    }
    if (structure.kind === "union") {
      throw new Error("Union not implemented");
    }
    throw new Error("Not implemented");
  }

  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === PATH) {
          return path;
        }
        if (prop === STRUCTURE) {
          return structure;
        }
        if (prop === GET) {
          return get;
        }
        if (prop === ROOT) {
          return rootStructure;
        }
        if (prop === "_") {
          return (sub: TGraphBase) => {
            const [base, ...rest] = sub[PATH];
            if (!base) {
              throw new Error("Invalid path");
            }
            let result = get(base);
            for (const prop of rest) {
              result = result[GET](prop, true);
            }
            return result;
          };
        }
        if (typeof prop === "symbol") {
          throw new Error(`Unsupported symbol property: ${String(prop)}`);
        }
        return get(prop);
      },
    },
  ) as TGraphBase;
}
