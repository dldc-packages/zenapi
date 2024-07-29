import * as v from "@valibot/valibot";
import { TYPES } from "./constants.ts";
import { graphInternal, type TGraphBaseAny } from "./graph.ts";
import type { TPrepareContext, TQueryUnknown } from "./prepare.ts";
import type { TBuiltinStructure, TRootStructure } from "./structure.types.ts";
import type {
  TBuiltinsFromConfig,
  TGraphBuiltins,
  TMiddleware,
} from "./types.ts";

export type TBuiltinGetSchema = (
  context: TPrepareContext,
  graph: TGraphBaseAny,
) => v.BaseSchema<any, any, any>;

export type TBuiltinPrepare = (
  structure: TBuiltinStructure,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) => TMiddleware | null;

export type TBuiltinMatch = (
  graph: TGraphBaseAny,
  stucture: TBuiltinStructure,
  value: unknown,
) => boolean;

export interface TBuiltinConfig<T> {
  [TYPES]: T;
  /**
   * Schema used to validate input
   */
  getSchema: TBuiltinGetSchema;
  /**
   * Create middleware to resolve the value
   */
  prepare: TBuiltinPrepare;
  /**
   * Used to disambiguate the value when used in a union
   */
  match: TBuiltinMatch;
}

export type TBuiltinTypesConfig = Record<
  string,
  TBuiltinConfig<any> | null
>;

export type TBuiltinTypes = Record<string, TBuiltinStructure>;

export function createBuiltins<Conf extends TBuiltinTypesConfig>(
  config: Conf,
): TGraphBuiltins<TBuiltinsFromConfig<Conf>> {
  const configResolved = {
    ...DEFAULT_BUILTINS,
    ...config,
  };
  const builtins: TBuiltinStructure[] = [];
  for (const [name, config] of Object.entries(configResolved)) {
    if (config) {
      const { getSchema, prepare, match } = config;
      builtins.push({
        kind: "builtin",
        key: `builtin.${name}`,
        name,
        getSchema,
        prepare,
        match,
      });
    }
  }

  const rootStructure: TRootStructure = {
    kind: "root",
    key: "root",
    mode: "builtins",
    builtins,
    types: [],
  };

  return graphInternal({
    rootStructure,
    localTypes: {},
    path: [],
  }) as any;
}

export function builtin<T>(
  config: Omit<TBuiltinConfig<T>, typeof TYPES>,
): TBuiltinConfig<T> {
  return {
    [TYPES]: null as any,
    ...config,
  };
}

export type TDefaultBuiltins = {
  Date: TBuiltinConfig<Date>;
};

export const DEFAULT_BUILTINS: TDefaultBuiltins = {
  Date: builtin<Date>({
    getSchema: () => v.date(),
    prepare: (structure) => {
      return async (ctx, next) => {
        const res = await next(ctx);
        const value = res.value;
        if (value === undefined) {
          throw new Error(`Value is undefined at ${structure.key}`);
        }
        if (!(value instanceof Date)) {
          throw new Error(`Value is not a Date at ${structure.key}`);
        }
        return res;
      };
    },
    match: (_graph, _structure, value) => {
      if (value === undefined) {
        return false;
      }
      return value instanceof Date;
    },
  }),
};

export const DEFAULT_BUILTINS_GRAPH = createBuiltins<TDefaultBuiltins>(
  DEFAULT_BUILTINS,
);
