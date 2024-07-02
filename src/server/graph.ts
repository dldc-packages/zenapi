import type { TTypesBase } from "../utils/types.ts";
import { GET, PATH, ROOT, STRUCTURE, type TYPES } from "./constants.ts";
import { getStructureProp, type TGetStructurePropResult } from "./structure.ts";
import type { TAllStructure, TRootStructure } from "./structure.types.ts";
import type { TGraphOf } from "./types.ts";

export type TGraphBaseAny = TGraphBase<any>;

export interface TGraphBase<Base> {
  [TYPES]: { base: Base };
  [ROOT]: TRootStructure;
  [STRUCTURE]: TAllStructure;
  // This is a list of all leaf structures in the path.
  [PATH]: TAllStructure[];
  [GET]: (
    prop: string | number | TAllStructure,
    skipValidation?: boolean,
  ) => TGraphBaseAny;
  _<T extends TGraphBaseAny>(next: T): T;
}

export function graph<Types extends TTypesBase>(
  rootStructure: TRootStructure,
): TGraphOf<Types> {
  return proxy(rootStructure, []) as TGraphOf<Types>;
}

function proxy(
  rootStructure: TRootStructure,
  path: TAllStructure[],
): TGraphBaseAny {
  const cache = new WeakMap<TAllStructure, TGraphBaseAny>();
  const structure = path.length === 0 ? rootStructure : path[path.length - 1];

  function get(
    prop: string | number | TAllStructure,
    skipValidation = false,
  ): TGraphBaseAny {
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
      // prop is expected to be the matching ref
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
      // Prop is expected to be one of the union refs
      for (const unionItem of structure.types) {
        if (unionItem.kind === "ref") {
          const { structure: refStructure } = getStructureProp(
            rootStructure,
            rootStructure,
            unionItem.ref,
          );
          if (prop === refStructure) {
            return prop;
          }
        }
      }
      throw new Error(`Invalid path: ${prop.kind} is not a valid union type`);
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
        if (prop === Symbol.toPrimitive) {
          return () => {
            return structure.key;
          };
        }
        if (typeof prop === "symbol") {
          console.info(prop);
          throw new Error(`Unsupported symbol property`);
        }
        return get(prop);
      },
    },
  ) as TGraphBaseAny;
}
