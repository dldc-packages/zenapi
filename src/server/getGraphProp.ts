import { REF } from "./constants.ts";
import type {
  TAllStructure,
  TRootStructure,
  TStructure,
  TStructureKind,
  TStructureObjectProperty,
  TStructureRef,
} from "./structure.types.ts";
import type { TLocalTypes } from "./types.ts";

// Receive the last structure of the path, return the next tail
export type TStructureGetProp<TStruct extends TAllStructure> = (
  rootStructure: TRootStructure,
  localTypes: TLocalTypes,
  structure: TStruct,
  prop: string | number | symbol,
) => TAllStructure[];

type TGetPropByStructureKind = {
  [K in TStructureKind]: TStructureGetProp<Extract<TAllStructure, { kind: K }>>;
};

const GET_STRUCTURE_PROP: TGetPropByStructureKind = {
  root: (_rootStructure, _localTypes, structure, prop) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const item = structure.types.find((t) => t.name === prop);
    if (!item) {
      throw new Error(`Invalid path: "${prop}" not found at root`);
    }
    return [item];
  },
  ref: (rootStructure, localTypes, structure, prop) => {
    const { structure: refStructure, localTypes: nextLocalTypes } = resolveRef(
      rootStructure,
      localTypes,
      structure,
    );
    if (prop === REF) {
      return [structure, refStructure];
    }
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const nextStructure = getStructureProp(
      rootStructure,
      nextLocalTypes,
      refStructure,
      prop,
    );
    return [structure, ...nextStructure];
  },
  interface: (_rootStructure, _localTypes, structure, prop) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return [foundProp.structure];
  },
  alias: () => {
    throw new Error("Alias not implemented yet");
  },
  object: (_rootStructure, _localTypes, structure, prop) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return [foundProp.structure];
  },
  array: (_rootStructure, _localTypes, structure, prop) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    if (prop === "items") {
      return [structure.items];
    }
    throw new Error(`Invalid path: ${prop} not found in array`);
  },
  primitive: () => {
    throw new Error("Primitive has no properties");
  },
  literal: () => {
    throw new Error("Literal has no properties");
  },
  nullable: (rootStructure, localTypes, structure, prop) => {
    if (prop === REF) {
      return [structure.type];
    }
    if (typeof prop !== "string") {
      throw new Error(
        `Invalid path: expected string received ${String(prop)}`,
      );
    }
    return getStructureProp(rootStructure, localTypes, structure.type, prop);
  },
  union: (_rootStructure, _structure, _prop) => {
    throw new Error("Not implemented");
  },
  function: (_rootStructure, _localTypes, structure, prop) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    if (prop === "return") {
      return [structure.returns];
    }
    throw new Error(`Invalid path: ${prop} not found in function`);
  },
  arguments: () => {
    throw new Error(`Cannot get prop of arguments`);
  },
};

export function getStructureProp(
  rootStructure: TRootStructure,
  localTypes: TLocalTypes,
  structure: TAllStructure,
  prop: string | number | symbol,
): TAllStructure[] {
  return GET_STRUCTURE_PROP[structure.kind](
    rootStructure,
    localTypes,
    structure as any,
    prop,
  );
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
