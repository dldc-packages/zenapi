import type { TGetMiddlewares } from "./engine.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TRootStructure } from "./structure.types.ts";
import type { TMiddleware, TParamsContext } from "./types.ts";

import * as v from "@valibot/valibot";
import { compose } from "./compose.ts";
import { GET, REF, STRUCTURE } from "./constants.ts";
import { ApiContext } from "./context.ts";
import { getStructureSchema } from "./schema.ts";
import type { TAllStructure, TStructureKind } from "./structure.types.ts";

export type TQueryUnknown = unknown[];

// Return null if query is not valid
export type TPrepareFromOperator = (
  context: TPrepareContext,
  params: TParamsContext,
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
  params: TParamsContext,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
): TMiddleware {
  const structure = graph[STRUCTURE];
  const prepare = PREPARE_BY_STRUCTURE[structure.kind];
  if (!prepare) {
    throw new Error(`No prepare function for ${structure.kind}`);
  }
  const prepared = prepare(context, params, graph, query);
  if (prepared) {
    return prepared;
  }
  // try each operator
  for (const operator of context.operators) {
    const mid = operator(context, params, graph, query);
    if (mid) {
      return mid;
    }
  }
  throw new Error(`Invalid query: ${JSON.stringify(query)}`);
}

export type TStructureGetSchema<TStruct extends TAllStructure> = (
  context: TPrepareContext,
  structure: TStruct,
) => v.BaseSchema<any, any, any>;

export type TPrepareStructure = (
  context: TPrepareContext,
  params: TParamsContext,
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
  root: (context, params, graph, query) => {
    const [queryItem] = query;
    if (typeof queryItem !== "string") {
      return null;
    }
    if (queryItem !== context.entry) {
      throw new Error(`Invalid entry point: ${queryItem}`);
    }
    return prepareObjectLike(context, params, graph, query, identity);
  },
  interface: (context, params, graph, query) => {
    return prepareObjectLike(
      context,
      params,
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
  alias: (context, params, graph, query) => {
    const structure = graph[STRUCTURE];
    // throw new Error("Not implemented");
    if (structure.kind !== "alias") {
      throw new Error("Invalid structure");
    }
    const subGraph = graph[GET](REF);
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const sub = prepare(context, params, subGraph, query);
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      return sub(res, next);
    };
  },
  ref: (context, params, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "ref") {
      throw new Error("Invalid structure");
    }
    const subGraph = graph[GET](REF);
    const userResolvers = context.getResolvers(graph);
    const nextParams: TParamsContext = {
      ...params,
      paramerters: structure.params ?? [],
    };
    const mid = compose(...userResolvers);
    const subMid = prepare(context, nextParams, subGraph, query);
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      return subMid(res, next);
    };
  },
  object: (context, params, graph, query) => {
    return prepareObjectLike(
      context,
      params,
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
  array: (context, params, graph, query) => {
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
    const sub = prepare(context, params, subGraph, query);
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
  primitive: (context, _params, graph, query) => {
    if (query.length > 0) {
      throw new Error("Invalid query for primitive");
    }
    const structure = graph[STRUCTURE];
    if (structure.kind !== "primitive") {
      throw new Error("Invalid structure");
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
  literal: (context, _params, graph, query) => {
    if (query.length > 0) {
      throw new Error("Invalid query for primitive");
    }
    const structure = graph[STRUCTURE];
    if (structure.kind !== "literal") {
      throw new Error("Invalid structure");
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
  nullable: (context, params, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "nullable") {
      throw new Error("Invalid structure");
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
    const sub = prepare(context, params, subGraph, query);
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      const value = res.value;
      if (value === null) {
        return res;
      }
      return sub(res, next);
    };
  },
  union: (context, params, graph, query) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "union") {
      throw new Error("Invalid structure");
    }
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const subs = structure.types.map((subStructure) => {
      const subGraph = graph[GET](subStructure);
      return ({
        mid: prepare(context, params, subGraph, query),
        graph: subGraph,
        structure: subStructure,
      });
    });
    return async (ctx, next) => {
      const res = await mid(ctx, (ctx) => Promise.resolve(ctx));
      // TODO: don't brut force to find the right resolver
      // but instead, use the value to find the right resolver
      // or maybe add a ctx.withType() method ?
      for (const { mid } of subs) {
        try {
          return await mid(res, next);
        } catch {
          continue;
        }
      }
      throw new Error("Invalid query");
    };
  },
  function: (context, params, graph, query) => {
    const [queryItem, ...rest] = query;
    if (queryItem !== "()") {
      return null;
    }
    const structure = graph[STRUCTURE];
    if (structure.kind !== "function") {
      throw new Error("Invalid structure");
    }
    const variableIndex = context.getNextVariableIndex();
    const userResolvers = context.getResolvers(graph);
    const mid = compose(...userResolvers);
    const returnGraph = graph[GET]("return");
    const argsSchema = getStructureSchema(context, params, structure.arguments);
    const sub = prepare(context, params, returnGraph, rest);
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
  arguments: () => {
    throw new Error(`Cannot prepare arguments`);
  },
};

export type TStructureGetValue = (
  parent: unknown,
  prop: string | number,
) => unknown;

function prepareObjectLike(
  context: TPrepareContext,
  params: TParamsContext,
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
  const subMid = prepare(context, params, subGraph, rest);
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
