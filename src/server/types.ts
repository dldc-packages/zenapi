import type { Primitive } from "../utils/types.ts";
import type { GET, GRAPH_PATH, ROOT, STRUCTURE } from "./constants.ts";
import type { ApiContext } from "./context.ts";
import type { TAllStructure } from "./structure.ts";

export type TMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export type TTRansformResolver = (ctx: ApiContext, query: unknown) => unknown;

export interface TGraphRefBase {
  [STRUCTURE]: TAllStructure;
  [GRAPH_PATH]: TAllStructure[];
  [GET]: (
    prop: string | number | TAllStructure,
    skipValidation?: boolean,
  ) => TGraphRefBase;
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
