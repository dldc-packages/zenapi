import type { QUERY_RESULT } from "./constants.ts";
import { queryToJson } from "./queryBuilder.ts";
import type { TQuery } from "./types.ts";

export function obj<T extends Record<string, TQuery<any>>>(
  data: T,
): TQuery<{ [K in keyof T]: T[K][typeof QUERY_RESULT] }> {
  return {
    kind: "object",
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, queryToJson(value)]),
    ),
  } as any;
}

export function oneOf<T extends readonly TQuery<any>[]>(
  ...queries: T
): TQuery<T[number][typeof QUERY_RESULT]> {
  return { data: queries } as any;
}
