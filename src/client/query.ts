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
  return proxy([], []);
}

type TPath = readonly any[];

function proxy(path: TPath, variables: TVariables): any {
  return new Proxy(
    () => {},
    {
      get(_, prop) {
        if (prop === TO_JSON) {
          return [path, variables];
        }
        if (prop === "_") {
          return ((select) => {
            if (typeof select !== "function") {
              throw new Error("Invalid query function");
            }
            const children = select(proxy([], []));
            const [childrenJson, childVariables] = queryToJson(children);
            return proxy([...path, ...childrenJson], [
              ...variables,
              ...childVariables,
            ]);
          }) satisfies TQuerySelectFn<any>;
        }
        if (prop === "toString") {
          return () => {
            return JSON.stringify(path);
          };
        }
        return proxy([...path, prop], variables);
      },
      apply(_target, _thisArg, parameters) {
        return proxy([...path, "()"], [...variables, parameters]);
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
