import type { Primitive } from "../utils/types.ts";
import type { ApiContext } from "./context.ts";
import type { TGraphBase } from "./graph.ts";

export type TMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export type TGraphOf<T, Input> = T extends Primitive ? TGraphRefValue<T, Input>
  : T extends (...args: any) => any ? TGraphFunction<T>
  : T extends Array<infer U> ? TGraphArray<U, Input>
  : T extends Record<string, any> ? TGraphObject<T, Input>
  : TGraphBase<T, Input>;

export interface TGraphRefValue<T, Input> extends TGraphBase<T, Input> {
}

export interface TGraphFunction<
  Fn extends (...args: any) => any,
> extends TGraphBase<Fn, Parameters<Fn>> {
  return: TGraphOf<ReturnType<Fn>, never>;
}

export interface TGraphArray<T, Input> extends TGraphBase<T[], Input> {
  items: TGraphOf<T, never>;
}

export type TGraphObject<T extends Record<string, any>, Input> =
  & TGraphBase<T, Input>
  & { [K in keyof T]: TGraphOf<T[K], never> };
