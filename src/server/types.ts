import type { Primitive } from "../utils/types.ts";
import type { ApiContext } from "./context.ts";
import type { TGraphBase } from "./graph.ts";

export type TMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export type TGraphOf<T> = T extends Primitive ? TGraphRefValue
  : T extends (...args: any) => any
    ? TGraphFunction<Parameters<T>, ReturnType<T>>
  : T extends Array<infer U> ? TGraphArray<U>
  : T extends Record<string, any> ? TGraphObject<T>
  : TGraphBase;

export interface TGraphRefValue extends TGraphBase {
}

export interface TGraphFunction<
  Params extends any[],
  Result,
> extends TGraphBase {
  args: TGraphOf<Params>;
  result: TGraphOf<Result>;
}

export interface TGraphArray<T> extends TGraphBase {
  items: TGraphOf<T>;
}

export type TGraphObject<T> =
  & TGraphBase
  & { [K in keyof T]: TGraphOf<T[K]> };
