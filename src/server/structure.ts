import * as v from "@valibot/valibot";
import { compose } from "./compose.ts";
import { GET } from "./constants.ts";
import { ApiContext } from "./context.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TPrepareContext, TQueryUnknown } from "./prepare.ts";
import { prepare } from "./prepare.ts";
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
  context: TPrepareContext,
  structure: TStruct,
  graph: TGraphBaseAny,
) => TMiddleware | null;

export type TStructureGetSchema<TStruct extends TAllStructure> = (
  context: TPrepareContext,
  structure: TStruct,
) => v.BaseSchema<any, any, any>;

export type TPrepareStructure<TStruct extends TAllStructure> = (
  context: TPrepareContext,
  structure: TStruct,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) => TMiddleware | null;

interface TStructureConfig<TStruct extends TAllStructure> {
  prepare: TPrepareStructure<TStruct>;
  getSchema: TStructureGetSchema<TStruct>;
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

const identity: TMiddleware = (ctx, next) => next(ctx);

const STRUCTURE_CONFIG: TByStructureKind = {
  root: {
    prepare: (context, structure, graph, query) => {
      const [queryItem] = query;
      if (typeof queryItem !== "string") {
        return null;
      }
      if (queryItem !== context.entry) {
        throw new Error(`Invalid entry point: ${queryItem}`);
      }
      return prepareFromPath(context, structure, graph, query);
    },
    getSchema: () => {
      throw new Error("Root schema should not be called");
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
    prepare: (context, structure, graph, query) => {
      const userResolvers = context.getResolvers(graph);
      const subStructure = resolveRef(context.rootStructure, structure);
      const subMid = prepare(context, subStructure, graph, query);
      return compose(...userResolvers, subMid);
    },
    getSchema: (context, structure) => {
      const refStructure = resolveRef(context.rootStructure, structure);
      return getStructureSchema(context, refStructure);
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
    getValue: () => {
      throw new Error("Ref value should not be accessed");
    },
  },
  object: {
    prepare: (context, structure, graph, query) => {
      return prepareFromPath(
        context,
        structure,
        graph,
        query,
        async (ctx, next) => {
          const resolved = await next(ctx);
          const value = resolved.value;
          if (value === undefined) {
            return resolved.withValue({});
          }
          if (typeof value !== "object") {
            throw new Error("Expected object");
          }
          return resolved;
        },
      );
    },
    getSchema: (context, structure) => {
      const properties = structure.properties.map(
        ({ name, optional, structure }) => {
          const propSchema = getStructureSchema(context, structure);
          return [
            name,
            optional ? v.optional(propSchema) : propSchema,
          ] as const;
        },
      );
      return v.strictObject(Object.fromEntries(properties));
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
      if (!value) {
        return undefined;
      }
      return (value as Record<string, unknown>)[prop];
    },
  },
  array: {
    prepare: (context, structure, graph, query) => {
      const baseMid: TMiddleware = async (ctx, next) => {
        const res = await next(ctx);
        const value = res.value;
        if (value === undefined) {
          return res.withValue([]);
        }
        if (!Array.isArray(value)) {
          throw new Error("Expected array");
        }
        return res;
      };
      const userResolvers = context.getResolvers(graph);
      const mid = compose(baseMid, ...userResolvers);
      const subGraph = graph[GET]("items");
      const sub = prepare(context, structure.items, subGraph, query);
      return async (ctx, next) => {
        const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
        const value = res.value as unknown[];
        const nextValue = await Promise.all(
          value.map(async (v) => {
            const ctx2 = await sub(res.withValue(v), next);
            return ctx2.value;
          }),
        );
        return res.withValue(nextValue);
      };
    },
    getSchema: (context, structure) => {
      const itemSchema = getStructureSchema(context, structure.items);
      return v.array(itemSchema);
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
    prepare: (context, structure, graph, query) => {
      if (query.length > 0) {
        throw new Error("Invalid query for primitive");
      }
      const baseMid: TMiddleware = async (ctx, next) => {
        const res = await next(ctx);
        const value = res.value;
        if (value === undefined) {
          throw new Error(`Value is undefined at ${structure.key}`);
        }
        // deno-lint-ignore valid-typeof
        if (typeof value !== structure.type) {
          throw new Error(`Expected ${structure.type}, got ${typeof value}`);
        }
        return res;
      };
      const userResolvers = context.getResolvers(graph);
      return compose(baseMid, ...userResolvers);
    },
    getSchema: (_context, structure) => {
      switch (structure.type) {
        case "string":
          return v.string();
        case "number":
          return v.number();
        case "boolean":
          return v.boolean();
      }
    },
    getProp: () => {
      throw new Error("Primitive has no properties");
    },
    getValue: () => {
      throw new Error("Cannot get value of primitive");
    },
  },
  literal: {
    prepare: (context, structure, graph, query) => {
      if (query.length > 0) {
        throw new Error("Invalid query for primitive");
      }
      const baseMid: TMiddleware = async (ctx, next) => {
        const res = await next(ctx);
        const value = res.value;
        if (value === undefined) {
          throw new Error("Value is undefined");
        }
        if (value !== structure.type) {
          throw new Error(`Expected ${structure.type}, got ${value}`);
        }
        return res;
      };
      const userResolvers = context.getResolvers(graph);
      return compose(baseMid, ...userResolvers);
    },
    getSchema: (_context, structure) => {
      if (structure.type === null) {
        return v.null_();
      }
      return v.literal(structure.type);
    },
    getProp: () => {
      throw new Error("Literal has no properties");
    },
    getValue: () => {
      throw new Error("Cannot get value of literal");
    },
  },
  union: {
    prepare: notImplemented("union.prepare"),
    getSchema: notImplemented("union.getSchema"),
    getProp: notImplemented("union.getProp"),
    getValue: notImplemented("union.getValues"),
  },
  function: {
    prepare: (context, structure, graph, query) => {
      const [queryItem, ...rest] = query;
      if (queryItem !== "()") {
        return null;
      }
      const variableIndex = context.getNextVariableIndex();
      const userResolvers = context.getResolvers(graph);
      const mid = compose(...userResolvers);
      const returnGraph = graph[GET]("return");
      const argsSchema = getStructureSchema(context, structure.arguments);
      const sub = prepare(context, structure.returns, returnGraph, rest);
      return async (ctx, next) => {
        const baseValue = ctx.value;
        const variables = ctx.getOrFail(ApiContext.VariablesKey.Consumer);
        const args = variables[variableIndex];
        const parsed = v.parse(argsSchema, args);
        const prevInputs = ctx.getOrFail(ApiContext.InputsKey.Consumer);
        const inputs = new Map(prevInputs);
        inputs.set(graph, parsed);
        const parentRes = await mid(
          ctx.with(ApiContext.InputsKey.Provider(inputs)).withValue(baseValue),
          (ctx) => Promise.resolve(ctx),
        );
        return sub(parentRes.withValue(parentRes.value), next);
      };
    },
    getSchema: notImplemented("function.getSchema"),
    getProp: (_rootStructure, structure, prop) => {
      if (prop === "return") {
        return { structure: structure.returns, isRoot: false };
      }
      throw new Error(`Invalid path: ${prop} not found in function`);
    },
    getValue: () => {
      throw new Error("Cannot get value of function");
    },
  },
  arguments: {
    prepare: () => {
      throw new Error(`Cannot prepare arguments`);
    },
    getSchema: (context, structure) => {
      const argsSchema = structure.arguments.map((arg) => {
        const argSchema = getStructureSchema(context, arg.structure);
        return arg.optional ? v.optional(argSchema) : argSchema;
      });
      return v.tuple(argsSchema);
    },
    getProp: () => {
      throw new Error(`Cannot get prop of arguments`);
    },
    getValue: () => {
      throw new Error("Cannot get value of arguments");
    },
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

export function getStructureSchema(
  context: TPrepareContext,
  structure: TAllStructure,
): v.BaseSchema<any, any, any> {
  return STRUCTURE_CONFIG[structure.kind].getSchema(context, structure as any);
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

export function prepareStructure(
  context: TPrepareContext,
  structure: TAllStructure,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
): TMiddleware | null {
  const prepare = STRUCTURE_CONFIG[structure.kind].prepare;
  if (!prepare) {
    throw new Error(`No prepare function for ${structure.kind}`);
  }
  return prepare(context, structure as any, graph, query);
}

function prepareFromPath(
  context: TPrepareContext,
  structure: TAllStructure,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
  resolver: TMiddleware = identity,
): TMiddleware | null {
  const [queryItem, ...rest] = query;
  if (typeof queryItem !== "string" && typeof queryItem !== "number") {
    return null;
  }
  const userResolvers = context.getResolvers(graph);
  const mid = compose(resolver, ...userResolvers);
  const subGraph = graph[GET](queryItem);
  const subStructure =
    getStructureProp(context.rootStructure, structure, queryItem).structure;
  const subMid = prepare(context, subStructure, subGraph, rest);
  return async (ctx, next) => {
    const parentRes = await mid(ctx, (ctx) => Promise.resolve(ctx));
    const subValue = getStructureValue(structure, parentRes.value, queryItem);
    return subMid(
      parentRes.withValue(subValue).with(
        ApiContext.GraphKey.Provider(subGraph),
      ),
      next,
    );
  };
}
