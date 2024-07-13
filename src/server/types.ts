import type { Primitive } from "../utils/types.ts";
import type { ApiContext } from "./context.ts";
import type { TGraphBase } from "./graph.ts";
import type { TAllStructure, TStructure } from "./structure.types.ts";

export type TMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export type TGraphOf<T, Input> = T extends Primitive ? TGraphBase<Input>
  : T extends (...args: any) => any ? TGraphFunction<T>
  : T extends Array<infer U> ? TGraphArray<U, Input>
  : T extends Record<string, any> ? TGraphObject<T, Input>
  : TGraphBase<Input>;

export interface TGraphFunction<
  Fn extends (...args: any) => any,
> extends TGraphBase<Parameters<Fn>> {
  return: TGraphOf<NonNullable<ReturnType<Fn>>, never>;
}

export interface TGraphArray<T, Input> extends TGraphBase<Input> {
  items: TGraphOf<NonNullable<T>, never>;
}

export type TGraphObject<T extends Record<string, any>, Input> =
  & TGraphBase<Input>
  & { [K in keyof T]: TGraphOf<NonNullable<T[K]>, never> };

export interface TParamsContext {
  localTypes: TLocalTypes;
  paramerters: TAllStructure[];
}

export type TLocalTypes = Record<string, TStructure>;
