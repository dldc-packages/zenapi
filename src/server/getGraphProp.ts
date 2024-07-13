import { pushTail, replaceTail } from "../utils/tail.ts";
import { GET, REF } from "./constants.ts";
import { graphInternal, type TGraphBaseAny, type TGraphGet } from "./graph.ts";
import type {
  TAllStructure,
  TRootStructure,
  TStructure,
  TStructureKind,
  TStructureObjectProperty,
  TStructureRef,
} from "./structure.types.ts";
import type { TLocalTypes } from "./types.ts";

export interface TStructureGetPropParams<TStruct extends TAllStructure> {
  rootStructure: TRootStructure;
  get: TGraphGet;
  localTypes: TLocalTypes;
  path: TAllStructure[];
  structure: TStruct;
  prop: string | number | symbol;
}

// Receive the last structure of the path, return the next tail
export type TStructureGetProp<TStruct extends TAllStructure> = (
  params: TStructureGetPropParams<TStruct>,
) => TGraphBaseAny;

type TGetPropByStructureKind = {
  [K in TStructureKind]: TStructureGetProp<Extract<TAllStructure, { kind: K }>>;
};

const GET_STRUCTURE_PROP: TGetPropByStructureKind = {
  root: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const item = structure.types.find((t) => t.name === prop);
    if (!item) {
      throw new Error(`Invalid path: "${prop}" not found at root`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [item]),
    });
  },
  ref: ({ rootStructure, get, localTypes, path, structure, prop }) => {
    const { structure: refStructure, localTypes: nextLocalTypes } = resolveRef(
      rootStructure,
      localTypes,
      structure,
    );
    const resolved = graphInternal({
      rootStructure,
      localTypes: nextLocalTypes,
      path: pushTail(path, refStructure),
    });
    if (prop === REF) {
      return resolved;
    }
    const sub = get(REF);
    return sub[GET](prop);
  },
  interface: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [foundProp.structure]),
    });
  },
  alias: () => {
    throw new Error("Alias not implemented yet");
  },
  object: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [foundProp.structure]),
    });
  },
  array: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    if (prop === "items") {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.items]),
      });
    }
    throw new Error(`Invalid path: ${prop} not found in array`);
  },
  primitive: () => {
    throw new Error("Primitive has no properties");
  },
  literal: () => {
    throw new Error("Literal has no properties");
  },
  nullable: ({ rootStructure, get, localTypes, path, structure, prop }) => {
    if (prop === REF) {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.type]),
      });
    }
    if (typeof prop !== "string") {
      throw new Error(
        `Invalid path: expected string received ${String(prop)}`,
      );
    }
    const sub = get(REF);
    return sub[GET](prop);
  },
  union: () => {
    throw new Error("Not implemented");
  },
  function: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    if (prop === "return") {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.returns]),
      });
    }
    throw new Error(`Invalid path: ${prop} not found in function`);
  },
  arguments: () => {
    throw new Error(`Cannot get prop of arguments`);
  },
};

export function getStructureProp(
  params: TStructureGetPropParams<TAllStructure>,
): TGraphBaseAny {
  return GET_STRUCTURE_PROP[params.structure.kind](params as any);
}

export interface TResolvedRef {
  structure: TAllStructure;
  localTypes: TLocalTypes;
}

export function resolveRef(
  rootStructure: TRootStructure,
  localTypes: TLocalTypes,
  structure: TStructureRef,
): TResolvedRef {
  const subStructure = resolveRefStructure(
    rootStructure,
    localTypes,
    structure,
  );
  if (subStructure.kind !== "alias" && subStructure.kind !== "interface") {
    return { structure: subStructure, localTypes };
  }
  // Resolve local types
  if (structure.params.length !== subStructure.parameters.length) {
    throw new Error(
      `Invalid number of parameters: expected ${subStructure.parameters.length} but got ${structure.params.length}`,
    );
  }
  const nextLocalTypes: TLocalTypes = { ...localTypes };
  subStructure.parameters.forEach((name, index) => {
    nextLocalTypes[name] = structure.params[index];
  });
  return { structure: subStructure, localTypes: nextLocalTypes };
}

function resolveRefStructure(
  rootStructure: TRootStructure,
  localTypes: TLocalTypes,
  structure: TStructureRef,
): TStructure {
  const localStructure = localTypes[structure.ref];
  if (localStructure) {
    return localStructure;
  }
  const refStructure = rootStructure.types.find((t) =>
    t.name === structure.ref
  );
  if (!refStructure) {
    console.log({ localTypes });
    throw new Error(`Invalid ref "${structure.ref}"`);
  }
  return refStructure;
}
