import type { Primitive } from "../utils/types.ts";
import type { ApiContext } from "./context.ts";
import type { TGraphBase } from "./graph.ts";

export type TMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export type TGraphOf<T> = T extends Primitive ? TGraphRefValue<T>
  : T extends (...args: any) => any ? TGraphFunction<T>
  : T extends Array<infer U> ? TGraphArray<U>
  : T extends Record<string, any> ? TGraphObject<T>
  : TGraphBase<T>;

export interface TGraphRefValue<T> extends TGraphBase<T> {
}

export interface TGraphFunction<
  Fn extends (...args: any) => any,
> extends TGraphBase<Fn> {
  parameters: TGraphOf<Parameters<Fn>>;
  return: TGraphOf<ReturnType<Fn>>;
}

export interface TGraphArray<T> extends TGraphBase<T[]> {
  items: TGraphOf<T>;
}

export type TGraphObject<T extends Record<string, any>> =
  & TGraphBase<T>
  & { [K in keyof T]: TGraphOf<T[K]> };
