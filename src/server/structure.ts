import { PATH } from "./constants.ts";
import type {
  TAllStructure,
  TRootStructure,
  TStructure,
  TStructureKind,
  TStructureObjectProperty,
  TStructureRef,
} from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

export interface TGetStructurePropResult {
  structure: TAllStructure;
  isRoot: boolean;
}

export type TStructureGetProp<TStruct extends TAllStructure> = (
  rootStructure: TRootStructure,
  structure: TStruct,
  prop: string | number,
) => TGetStructurePropResult;

export type TStructureGetValue<TStruct extends TAllStructure> = (
  structure: TStruct,
  parent: unknown,
  prop: string | number,
) => unknown;

export type TStructureGetMiddleware<TStruct extends TAllStructure> = (
  rootStructure: TRootStructure,
  structure: TStruct,
) => TMiddleware;

interface TStructureConfig<TStruct extends TAllStructure> {
  getMiddleware: TStructureGetMiddleware<TStruct>;
  getProp: TStructureGetProp<TStruct>;
  getValue: TStructureGetValue<TStruct>;
}

type TByStructureKind = {
  [K in TStructureKind]: TStructureConfig<Extract<TAllStructure, { kind: K }>>;
};

function notImplemented(name: string) {
  return (): never => {
    throw new Error(`Not implemented: ${name}`);
  };
}

const STRUCTURE_CONFIG: TByStructureKind = {
  object: {
    getMiddleware: () => async (ctx, next) => {
      console.log("object middleware", ctx.graph[PATH].map((v) => v.key));
      const resolved = await next(ctx);
      const value = resolved.value;
      if (value === undefined) {
        console.log("object middleware: value is undefined");
        return resolved.withValue({});
      }
      if (typeof value !== "object") {
        throw new Error("Expected object");
      }
      return resolved;
    },
    getProp: (_rootStructure, structure, prop) => {
      const foundProp: TStructureObjectProperty | undefined = structure
        .properties.find((p) => p.name === prop);
      if (!foundProp) {
        throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
      }
      return { structure: foundProp.structure, isRoot: false };
    },
    getValue: (_structure, value, prop) => {
      return (value as Record<string, unknown>)[prop];
    },
  },
  root: {
    getMiddleware: () => () => {
      throw new Error("Root middleware should not be called");
    },
    getProp: (_rootStructure, structure, prop) => {
      const subStructure: TStructure = structure.types[prop];
      if (!subStructure) {
        throw new Error(`Invalid path: "${prop}" not found at root`);
      }
      return { structure: subStructure, isRoot: true };
    },
    getValue: () => {
      throw new Error("Root value should not be accessed");
    },
  },
  ref: {
    getMiddleware: (rootStructure, structure) => {
      const refStructure = resolveRef(rootStructure, structure);
      return getStructureMiddleware(rootStructure, refStructure);
    },
    getProp: (rootStructure, structure, prop) => {
      const refStructure = resolveRef(rootStructure, structure);
      const { structure: nextStructure } = getStructureProp(
        rootStructure,
        refStructure,
        prop,
      );
      return { structure: nextStructure, isRoot: true };
    },
    getValue: notImplemented("ref.getValues"),
  },
  array: {
    getMiddleware: () => async (ctx, next) => {
      const res = await next(ctx);
      const value = res.value;
      if (value === undefined) {
        return res.withValue([]);
      }
      if (!Array.isArray(value)) {
        throw new Error("Expected array");
      }
      return res;
    },
    getProp: (_rootStructure, structure, prop) => {
      if (prop === "items") {
        return { structure: structure.items, isRoot: false };
      }
      throw new Error(`Invalid path: ${prop} not found in array`);
    },
    getValue: (_structure, value, key) => {
      if (typeof key === "string") {
        throw new Error("Expected number, got string");
      }
      return (value as unknown[])[key];
    },
  },
  primitive: {
    getMiddleware: (_rootStructure, structure) => async (ctx, next) => {
      const res = await next(ctx);
      const value = res.value;
      if (value === undefined) {
        throw new Error("Value is undefined");
      }
      // deno-lint-ignore valid-typeof
      if (typeof value !== structure.type) {
        throw new Error(`Expected ${structure.type}, got ${typeof value}`);
      }
      return res;
    },
    getProp: () => {
      throw new Error("Primitive has no properties");
    },
    getValue: () => {
      throw new Error("Cannot get value of primitive");
    },
  },
  literal: {
    getMiddleware: (_rootStructure, structure) => async (ctx, next) => {
      const res = await next(ctx);
      const value = res.value;
      if (value === undefined) {
        throw new Error("Value is undefined");
      }
      if (value !== structure.type) {
        throw new Error(`Expected ${structure.type}, got ${value}`);
      }
      return res;
    },
    getProp: notImplemented("literal.getProp"),
    getValue: notImplemented("literal.getValues"),
  },
  union: {
    getMiddleware: notImplemented("union.middleware"),
    getProp: notImplemented("union.getProp"),
    getValue: notImplemented("union.getValues"),
  },
  function: {
    getMiddleware: notImplemented("function.middleware"),
    getProp: (_rootStructure, structure, prop) => {
      if (prop === "result") {
        return { structure: structure.returns, isRoot: false };
      }
      if (prop === "args") {
        return { structure: structure.arguments, isRoot: false };
      }
      throw new Error(`Invalid path: ${prop} not found in function`);
    },
    getValue: notImplemented("function.getValues"),
  },
  arguments: {
    getMiddleware: notImplemented("arguments.middleware"),
    getProp: notImplemented("arguments.getProp"),
    getValue: notImplemented("arguments.getValues"),
  },
  argument: {
    getMiddleware: notImplemented("argument.middleware"),
    getProp: notImplemented("argument.getProp"),
    getValue: notImplemented("argument.getValues"),
  },
};

export function getStructureProp(
  rootStructure: TRootStructure,
  structure: TAllStructure,
  prop: string | number,
): TGetStructurePropResult {
  return STRUCTURE_CONFIG[structure.kind].getProp(
    rootStructure,
    structure as any,
    prop,
  );
}

export function getStructureValue(
  structure: TAllStructure,
  value: unknown,
  key: string | number,
): unknown {
  return STRUCTURE_CONFIG.object.getValue(structure as any, value, key);
}

export function getStructureMiddleware(
  rootStructure: TRootStructure,
  structure: TAllStructure,
): TMiddleware {
  return STRUCTURE_CONFIG[structure.kind].getMiddleware(
    rootStructure,
    structure as any,
  );
}

function resolveRef(
  rootStructure: TRootStructure,
  structure: TStructureRef,
): TAllStructure {
  const refStructure = rootStructure.types[structure.ref];
  if (!refStructure) {
    throw new Error(`Invalid ref "${structure.ref}"`);
  }
  return refStructure;
}
