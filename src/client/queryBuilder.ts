import type { Primitive, TTypesBase } from "../utils/types.ts";
import { TO_JSON } from "./constants.ts";
import type { TQuery } from "./types.ts";

export type TObjectQueryBuilderFn<T extends Record<string, any>> = <
  Result extends TQuery<any>,
>(
  fnOrQuery:
    | Result
    | ((children: { [K in keyof T]: TQueryBuilderOf<T[K]> }) => Result),
) => Result;

export type TObjectQueryBuilder<T extends Record<string, any>> =
  & { [K in keyof T]: TQueryBuilderOf<T[K]> }
  & { _: TObjectQueryBuilderFn<T> };

export type TQueryBuilderOf<T> = T extends Primitive ? TQuery<T>
  : T extends (...args: any) => any
    ? (...args: Parameters<T>) => TQueryBuilderOf<ReturnType<T>>
  : T extends Array<infer U> ? TQueryBuilderOf<U>
  : T extends Record<string, any> ? TObjectQueryBuilder<T>
  : never;

export function queryBuilder<Types extends TTypesBase>(): TQueryBuilderOf<
  Types
> {
  return proxy("absolute", []);
}

type TPathItem = string | number | symbol | { kind: "call"; args: any[] };

type TPath = readonly TPathItem[];

type TKind = "absolute" | "relative";

function proxy(kind: TKind, path: TPath): any {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === TO_JSON) {
          return {
            kind,
            path,
          };
        }
        if (prop === "_") {
          return (fnOrQuery: any) => {
            const children = typeof fnOrQuery === "function"
              ? fnOrQuery(proxy("relative", []))
              : fnOrQuery;
            return {
              [TO_JSON]: {
                kind,
                path,
                _: queryToJson(children),
              },
            };
          };
        }
        return proxy(kind, [...path, prop]);
      },
      apply(_target, _thisArg, args) {
        return proxy(kind, [...path, { kind: "call", args }]);
      },
    },
  );
}

export function queryToJson<T>(query: TQuery<T>): unknown {
  const toJsonValue = query[TO_JSON];
  if (toJsonValue) {
    return toJsonValue;
  }
  return query;
}
