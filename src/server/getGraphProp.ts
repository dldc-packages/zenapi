import { REF } from "./constants.ts";
import type {
  TAllStructure,
  TRootStructure,
  TStructure,
  TStructureKind,
  TStructureObjectProperty,
  TStructureRef,
} from "./structure.types.ts";

// Receive the last structure of the path, return the next tail
export type TStructureGetProp<TStruct extends TAllStructure> = (
  rootStructure: TRootStructure,
  structure: TStruct,
  prop: string | number | symbol,
) => TAllStructure[];

type TGetPropByStructureKind = {
  [K in TStructureKind]: TStructureGetProp<Extract<TAllStructure, { kind: K }>>;
};

const GET_STRUCTURE_PROP: TGetPropByStructureKind = {
  root: (_rootStructure, structure, prop) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const keys = Object.keys(structure.types);
    if (!keys.includes(prop)) {
      throw new Error(`Invalid path: "${prop}" not found at root`);
    }
    const subStructure: TStructure = structure.types[prop];
    return [subStructure];
  },
  ref: (rootStructure, structure, prop) => {
    const refStructure = resolveRef(rootStructure, structure);
    if (prop === REF) {
      return [structure, refStructure];
    }
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const nextStructure = getStructureProp(
      rootStructure,
      refStructure,
      prop,
    );
    return [structure, ...nextStructure];
  },
  object: (_rootStructure, structure, prop) => {
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
  array: (_rootStructure, structure, prop) => {
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
  nullable: (rootStructure, structure, prop) => {
    if (prop === REF) {
      return [structure.type];
    }
    if (typeof prop !== "string") {
      throw new Error(
        `Invalid path: expected string received ${String(prop)}`,
      );
    }
    return getStructureProp(rootStructure, structure.type, prop);
  },
  union: (_rootStructure, _structure, _prop) => {
    throw new Error("Not implemented");
  },
  function: (_rootStructure, structure, prop) => {
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
  structure: TAllStructure,
  prop: string | number | symbol,
): TAllStructure[] {
  return GET_STRUCTURE_PROP[structure.kind](
    rootStructure,
    structure as any,
    prop,
  );
}

export function resolveRef(
  rootStructure: TRootStructure,
  structure: TStructureRef,
): TAllStructure {
  const refStructure = rootStructure.types[structure.ref];
  if (!refStructure) {
    throw new Error(`Invalid ref "${structure.ref}"`);
  }
  return refStructure;
}
