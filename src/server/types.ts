import type { Primitive } from "../utils/types.ts";
import type { GET, GRAPH_KEY, GRAPH_PATH, ROOT, SCHEMA } from "./constants.ts";
import type { ApiContext } from "./context.ts";
import type { TSchema } from "./parseSchema.ts";

export type TMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export interface TGraphRefBase {
  [GRAPH_PATH]: TGraphPath;
  [SCHEMA]: TSchema<any>;
  [GRAPH_KEY]: symbol;
  [GET]: (prop: string | number) => TGraphRefBase;
  _<T extends TGraphRefBase>(next: T): T;
}

export type TGraphRefOf<T> = T extends Primitive ? TGraphRefValue
  : T extends (...args: any) => any
    ? TGraphRefFunction<Parameters<T>, ReturnType<T>>
  : T extends Array<infer U> ? TGraphRefArray<U>
  : T extends Record<string, any> ? TGraphRefObject<T>
  : TGraphRefBase;

export type TGraphPathItem = string | number | typeof ROOT;

export type TGraphPath = TGraphPathItem[];

export interface TGraphRefValue extends TGraphRefBase {
}

export interface TGraphRefFunction<
  Params extends any[],
  Result,
> extends TGraphRefBase {
  args: TGraphRefOf<Params>;
  result: TGraphRefOf<Result>;
}

export interface TGraphRefArray<T> extends TGraphRefBase {
  items: TGraphRefOf<T>;
}

export type TGraphRefObject<T> =
  & TGraphRefBase
  & { [K in keyof T]: TGraphRefOf<T[K]> };
