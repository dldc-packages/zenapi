import type { TTypesBase } from "../utils/types.ts";
import { GET, PATH, REF, ROOT, STRUCTURE, type TYPES } from "./constants.ts";
import { getStructureProp, resolveRef } from "./getGraphProp.ts";
import type { TAllStructure, TRootStructure } from "./structure.types.ts";
import type { TGraphOf, TLocalTypes } from "./types.ts";

export type TGraphBaseAny = TGraphBase<any>;

export interface TGraphBase<Input> {
  [TYPES]: { input: Input };
  [ROOT]: TRootStructure;
  [STRUCTURE]: TAllStructure;
  // This is a list of all leaf structures in the path.
  [PATH]: TAllStructure[];
  [GET]: (prop: string | number | symbol | TAllStructure) => TGraphBaseAny;
  // Shortcut to [GET](REF)
  [REF]: TGraphBaseAny;
  _<T extends TGraphBaseAny>(next: T): T;
}

export function graph<Types extends TTypesBase>(
  rootStructure: TRootStructure,
): TGraphOf<Types, never> {
  return proxy(rootStructure, {}, []) as TGraphOf<Types, never>;
}

function proxy(
  rootStructure: TRootStructure,
  localTypes: TLocalTypes,
  path: TAllStructure[],
): TGraphBaseAny {
  const cache = new Map<
    string | number | symbol | TAllStructure,
    TGraphBaseAny
  >();
  const structure = path.length === 0 ? rootStructure : path[path.length - 1];

  function get(
    prop: string | number | symbol | TAllStructure,
  ): TGraphBaseAny {
    if (cache.has(prop)) {
      return cache.get(prop)!;
    }
    const nextTails = getNextTail(prop);
    const nextPath: TAllStructure[] = path.slice(0, -1);
    nextPath.push(...nextTails);
    const result = proxy(rootStructure, localTypes, nextPath);
    cache.set(prop, result);
    return result;
  }

  function getNextTail(
    prop: string | number | symbol | TAllStructure,
  ): TAllStructure[] {
    if (
      typeof prop === "string" || typeof prop === "number" ||
      typeof prop === "symbol"
    ) {
      return getStructureProp(rootStructure, localTypes, structure, prop);
    }
    // Get by ref
    return [structure, validateNextStructureByRef(prop)];
  }

  function validateNextStructureByRef(prop: TAllStructure): TAllStructure {
    if (structure.kind === "ref") {
      // prop is expected to be the matching ref
      const resolved = resolveRef(rootStructure, localTypes, structure);
      if (resolved.structure !== prop) {
        throw new Error(
          `Invalid path: expected ${structure.key} but got ${resolved.structure.key}`,
        );
      }
      return prop;
    }
    if (structure.kind === "union") {
      // Prop is expected to be one of the union refs
      for (const unionItem of structure.types) {
        if (unionItem.kind === "ref") {
          const resolved = resolveRef(rootStructure, localTypes, unionItem);
          if (resolved.structure === prop) {
            return prop;
          }
        }
      }
      throw new Error(`Invalid path: ${prop.kind} is not a valid union type`);
    }
    throw new Error(
      `Cannot access by structure reference in ${structure.kind}`,
    );
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
        if (prop === Symbol.toPrimitive) {
          return () => {
            return structure.key;
          };
        }
        return get(prop);
      },
    },
  ) as TGraphBaseAny;
}
