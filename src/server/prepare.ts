import type { TGetMiddlewares } from "./engine.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TRootStructure } from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

import * as v from "@valibot/valibot";
import { compose } from "./compose.ts";
import { GET, REF, STRUCTURE } from "./constants.ts";
import { ApiContext, type TInputItem } from "./context.ts";
import { matchUnionType } from "./match.ts";
import { getStructureSchema } from "./schema.ts";
import type { TAllStructure, TStructureKind } from "./structure.types.ts";

export type TQueryUnknown = unknown[];

// Return null if query is not valid
export type TPrepareFromOperator = (
  context: TPrepareContext,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) => TMiddleware | null;

export interface TPrepareContext {
  entry: string;
  rootGraph: TGraphBaseAny;
  rootStructure: TRootStructure;
  operators: TPrepareFromOperator[];
  getNextVariableIndex: () => number;
  getResolvers: TGetMiddlewares;
}

export function prepare(
  context: TPrepareContext,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
): TMiddleware {
  const structure = graph[STRUCTURE];
  const prepare = PREPARE_BY_STRUCTURE[structure.kind];
  if (!prepare) {
    throw new Error(`No prepare function for ${structure.kind}`);
  }
  const prepared = prepare(context, graph, query);
  if (prepared) {
    return prepared;
  }
  // try each operator
  for (const operator of context.operators) {
    const mid = operator(context, graph, query);
    if (mid) {
      return mid;
    }
  }
  throw new Error(`Invalid query at ${structure.key}`);
}

export type TStructureGetSchema<TStruct extends TAllStructure> = (
  context: TPrepareContext,
  structure: TStruct,
) => v.BaseSchema<any, any, any>;

export type TPrepareStructure = (
  context: TPrepareContext,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) => TMiddleware | null;

type TByStructureKind = {
  [K in TStructureKind]: TPrepareStructure;
};

const identity: TMiddleware = (ctx, next) => next(ctx);

function getRecordProp(value: unknown, prop: string | number) {
  if (!value) {
    return undefined;
  }
  return (value as Record<string, unknown>)[prop];
}

const PREPARE_BY_STRUCTURE: TByStructureKind = {
  root: (context, graph, query) => {
    const [queryItem] = query;
    if (typeof queryItem !== "string") {
      return null;
    }
    if (queryItem !== context.entry) {
      throw new Error(`Invalid entry point: ${queryItem}`);
    }
    return prepareObjectLike(context, graph, query, identity);
  },
  interface: (context, graph, query) => {
    return prepareObjectLike(
      context,
      graph,
      query,
      async (ctx, next) => {
        const resolved = await next(ctx);
        const value = resolved.value;
        if (value === undefined) {
          return resolved.withValue({});
        }
        if (typeof value !== "object") {
          throw new Error(`Expected object at ${graph[STRUCTURE].key}`);
        }
        return resolved;
      },
    );
  },
  alias: (context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "alias") {
      throw new Error(`Invalid structure at ${structure.key}`);
    }
    const subGraph = graph[GET](REF);
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const sub = prepare(context, subGraph, query);
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      return sub(res, next);
    };
  },
  ref: (context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "ref") {
      throw new Error(`Invalid structure at ${structure.key}`);
    }
    const subGraph = graph[GET](REF);
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const subMid = prepare(context, subGraph, query);
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      return subMid(res, next);
    };
  },
  object: (context, graph, query) => {
    return prepareObjectLike(
      context,
      graph,
      query,
      async (ctx, next) => {
        const resolved = await next(ctx);
        const value = resolved.value;
        if (value === undefined) {
          return resolved.withValue({});
        }
        if (typeof value !== "object") {
          throw new Error(
            `Expected object at ${graph[STRUCTURE].key}, got ${value}`,
          );
        }
        return resolved;
      },
    );
  },
  array: (context, graph, query) => {
    const baseMid: TMiddleware = async (ctx, next) => {
      const res = await next(ctx);
      const value = res.value;
      if (value === undefined) {
        return res.withValue([]);
      }
      if (!Array.isArray(value)) {
        throw new Error(
          `Expected array at ${graph[STRUCTURE].key}, got ${value}`,
        );
      }
      return res;
    };
    const userResolvers = context.getResolvers(graph);
    const mid = compose(baseMid, ...userResolvers);
    const subGraph = graph[GET]("items");
    const sub = prepare(context, subGraph, query);
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
  primitive: (context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (query.length > 0) {
      throw new Error(`Invalid query for primitive at ${structure.key}`);
    }
    if (structure.kind !== "primitive") {
      throw new Error(`Invalid structure at ${structure.key}`);
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
  literal: (context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (query.length > 0) {
      throw new Error(`Invalid query for primitive at ${structure.key}`);
    }
    if (structure.kind !== "literal") {
      throw new Error(`Invalid structure at ${structure.key}`);
    }
    const baseMid: TMiddleware = async (ctx, next) => {
      const res = await next(ctx);
      const value = res.value;
      if (value === undefined) {
        throw new Error(`Value is undefined at ${structure.key}`);
      }
      if (value !== structure.type) {
        throw new Error(
          `Expected ${structure.type}, got ${value} at ${structure.key}`,
        );
      }
      return res;
    };
    const userResolvers = context.getResolvers(graph);
    return compose(baseMid, ...userResolvers);
  },
  nullable: (context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "nullable") {
      throw new Error(`Invalid structure at ${structure.key}`);
    }
    const baseMid: TMiddleware = async (ctx, next) => {
      const res = await next(ctx);
      const value = res.value;
      if (value === undefined) {
        return res.withValue(null);
      }
      return res;
    };
    const userResolvers = context.getResolvers(graph);
    const mid = compose(baseMid, ...userResolvers);
    const subGraph = graph[REF];
    const sub = prepare(context, subGraph, query);
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      const value = res.value;
      if (value === null) {
        return res;
      }
      return sub(res, next);
    };
  },
  union: (context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "union") {
      throw new Error(`Invalid structure at ${structure.key}`);
    }
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const subs = structure.types.map((subStructure) => {
      const subGraph = graph[GET](subStructure);
      return ({
        mid: prepare(context, subGraph, query),
        graph: subGraph,
        structure: subStructure,
      });
    });
    return async (ctx, next) => {
      const res = await mid(
        ctx.withValueType(null),
        (ctx) => Promise.resolve(ctx),
      );
      const subGraph = matchUnionType(
        graph,
        res.value,
        res.get(ApiContext.ValueTypeKey.Consumer),
      );
      const sub = subs.find((sub) => sub.graph === subGraph);
      if (!sub) {
        throw new Error(
          `Unexpected: missing sub middleware for resolved type ${
            subGraph[STRUCTURE].key
          }`,
        );
      }
      return sub.mid(res, next);
    };
  },
  function: (context, graph, query) => {
    const [queryItem, ...rest] = query;
    if (queryItem !== "()") {
      return null;
    }
    const variableIndex = context.getNextVariableIndex();
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const returnGraph = graph[GET]("return");
    const argsGraph = graph[GET]("arguments");
    const argsSchema = getStructureSchema(context, argsGraph);
    const sub = prepare(context, returnGraph, rest);
    return async (ctx) => {
      const baseValue = ctx.value;
      const variables = ctx.getOrFail(ApiContext.VariablesKey.Consumer);
      const args = variables[variableIndex];
      const parsed = v.parse(argsSchema, args);
      const prevInputs = ctx.getOrFail(ApiContext.InputsKey.Consumer);
      const inputs: TInputItem[] = [...prevInputs, {
        path: graph,
        inputs: parsed,
      }];
      const parentRes = await mid(
        ctx.with(ApiContext.InputsKey.Provider(inputs)).withValue(baseValue),
        (ctx) => Promise.resolve(ctx),
      );
      return sub(parentRes, (ctx) => Promise.resolve(ctx));
    };
  },
  arguments: () => {
    throw new Error(`Cannot prepare arguments`);
  },
  builtin: (_context, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "builtin") {
      throw new Error(`Invalid structure at ${structure.key}`);
    }
    const baseMid = structure.prepare(structure, graph, query);
    return baseMid;
  },
};

export type TStructureGetValue = (
  parent: unknown,
  prop: string | number,
) => unknown;

function prepareObjectLike(
  context: TPrepareContext,
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
  const subMid = prepare(context, subGraph, rest);
  return async (ctx, next) => {
    const parentRes = await mid(ctx, (ctx) => Promise.resolve(ctx));
    const subValue = getRecordProp(parentRes.value, queryItem);
    return subMid(
      parentRes
        .withValue(subValue)
        .with(ApiContext.GraphKey.Provider(subGraph)),
      next,
    );
  };
}
