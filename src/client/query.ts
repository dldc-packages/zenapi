import type { TTypesBase } from "../utils/types.ts";
import { type RESULT, TO_JSON } from "./constants.ts";
import type {
  TQueryAny,
  TQueryBase,
  TQueryDef,
  TQueryOf,
  TQuerySelectFn,
  TVariables,
} from "./query.types.ts";

/**
 * TODO:
 * - Store external data (variables) outside of the query and point to them using a stable ref (hash the path ?)
 * - Make sure to properly handle the _() function
 */

export function query<Types extends TTypesBase>(): TQueryOf<
  Types
> {
  return proxy("absolute", [], []);
}

type TPath = readonly any[];

type TKind = "absolute" | "relative";

function proxy(kind: TKind, path: TPath, variables: TVariables): any {
  return new Proxy(
    () => {},
    {
      get(_, prop) {
        if (prop === TO_JSON) {
          if (kind === "absolute") {
            return [["$", ...path], variables];
          }
          return [path, variables];
        }
        if (prop === "_") {
          return ((fnOrQuery) => {
            if (typeof fnOrQuery !== "function") {
              throw new Error("Invalid query function");
            }
            const children = fnOrQuery(proxy("relative", [], []));
            const [childrenJson, childVariables] = queryToJson(children);
            return proxy(kind, [...path, ...childrenJson], [
              ...variables,
              ...childVariables,
            ]);
          }) satisfies TQuerySelectFn<any, any>;
        }
        if (prop === "toString") {
          return () => {
            return JSON.stringify({ kind, path });
          };
        }
        return proxy(kind, [...path, prop], variables);
      },
      apply(_target, _thisArg, parameters) {
        return proxy(kind, [...path, "()"], [
          ...variables,
          parameters,
        ]);
      },
    },
  );
}

export function queryToJson(
  query: TQueryAny,
): [query: TQueryDef, variables: TVariables] {
  return query[TO_JSON];
}

function staticQuery<T>(
  def: TQueryDef,
  variables: TVariables,
): TQueryBase<T> {
  return {
    [TO_JSON]: [def, variables],
  } as any;
}

export function obj<T extends Record<string, TQueryAny>>(
  data: T,
): TQueryBase<{ [K in keyof T]: T[K][typeof RESULT] }> {
  const dataJson: { key: string; value: TQueryDef }[] = [];
  const variables: TVariables = [];
  for (const [key, value] of Object.entries(data)) {
    const [itemJson, itemVariables] = queryToJson(value);
    dataJson.push({ key, value: itemJson });
    variables.push(...itemVariables);
  }

  return staticQuery([{ kind: "object", data: dataJson }], variables) as any;
}

// export function oneOf<T extends readonly TQuery<any>[]>(
//   ...queries: T
// ): TQuery<T[number][typeof RESULT]> {
//   return { data: queries } as any;
// }
