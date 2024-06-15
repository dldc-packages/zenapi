import type { TTypesBase } from "../utils/types.ts";
import { GET, GRAPH_PATH, STRUCTURE } from "./constants.ts";
import type {
  TAllStructure,
  TRootStructure,
  TStructure,
  TStructureObjectProperty,
} from "./structure.ts";
import type { TGraphRefBase, TGraphRefOf } from "./types.ts";

export function schemaRef<Types extends TTypesBase>(
  rootStructure: TRootStructure,
): TGraphRefOf<Types> {
  return proxy(rootStructure, []) as TGraphRefOf<Types>;
}

function proxy(
  rootStructure: TRootStructure,
  path: TAllStructure[],
): TGraphRefBase {
  const cache = new WeakMap<TAllStructure, TGraphRefBase>();
  const structure = path.length === 0 ? rootStructure : path[path.length - 1];

  function get(
    prop: string | number | TAllStructure,
    skipValidation = false,
  ): TGraphRefBase {
    const nextStructure = getNextStructure(prop, skipValidation);
    if (cache.has(nextStructure)) {
      return cache.get(nextStructure)!;
    }
    const nextPath = [...path, nextStructure];
    const result = proxy(rootStructure, nextPath);
    cache.set(nextStructure, result);
    return result;
  }

  function getNextStructure(
    prop: string | number | TAllStructure,
    skipValidation: boolean,
  ): TAllStructure {
    if (typeof prop === "string" || typeof prop === "number") {
      return getNextStructureByKey(rootStructure, structure, prop);
    }
    if (skipValidation) {
      return prop;
    }
    return validateNextStructureByRef(prop);
  }

  function validateNextStructureByRef(prop: TAllStructure): TAllStructure {
    if (structure.kind === "ref") {
      // prop is epxected to be the matching ref
      const refStructure = getNextStructureByKey(
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
        if (prop === GRAPH_PATH) {
          return path;
        }
        if (prop === STRUCTURE) {
          return structure;
        }
        if (prop === GET) {
          return get;
        }
        if (prop === "_") {
          return (sub: TGraphRefBase) => {
            const [base, ...rest] = sub[GRAPH_PATH];
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
  ) as TGraphRefBase;
}

function getNextStructureByKey(
  rootStructure: TRootStructure,
  structure: TAllStructure,
  prop: string | number,
): TAllStructure {
  if (structure.kind === "object") {
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ???`);
    }
    return foundProp.structure;
  }
  if (structure.kind === "root") {
    const subStructure: TStructure = structure.types[prop];
    if (!subStructure) {
      throw new Error(`Invalid path: ${prop} not found at root`);
    }
    return subStructure;
  }
  if (structure.kind === "ref") {
    // resolve ref from root
    const refStructure = rootStructure.types[structure.ref];
    if (!refStructure) {
      throw new Error(`Invalid ref "${structure.ref}"`);
    }
    return getNextStructureByKey(rootStructure, refStructure, prop);
  }
  throw new Error(`Not implemented ${prop} on ${structure.kind}`);
}
