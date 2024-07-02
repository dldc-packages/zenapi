import type { Primitive } from "../utils/types.ts";
import type { RESULT, TO_JSON } from "./constants.ts";

export interface TQuerySelectFn<Base, Result> {
  <T extends TQueryAny>(type: T): T;
  <T extends TQueryAny>(select: (current: TQueryOf<Base>) => T): T;
}

export type TQueryAny = TQueryBase<any>;

export type TQueryDef = any[];

export type TVariables = unknown[];

export interface TQueryBase<Result> {
  [RESULT]: Result;
  [TO_JSON]: [TQueryDef, TVariables];
}

export interface TQueryBaseSelect<Base, Result> extends TQueryBase<Result> {
  [RESULT]: Result;
  [TO_JSON]: [TQueryDef, TVariables];
  _: TQuerySelectFn<Base, Result>;
}

export type TQueryOfObject<T extends Record<string, any>> =
  & { [K in keyof T]: TQueryOf<T[K]> }
  & TQueryBaseSelect<T, null>;

export interface TQueryOfArray<T> extends TQueryBase<null> {
  _: TQueryArraySelectFn<T>;
}

export interface TQueryArraySelectFn<Item> {
  <T extends TQueryAny>(
    select: (current: TQueryOf<Item>) => T,
  ): TQueryBase<T[typeof RESULT][]>;
}

export type TQueryOf<T> = T extends Primitive ? TQueryBaseSelect<T, T>
  : T extends (...args: any) => any
    ? (...args: Parameters<T>) => TQueryOf<ReturnType<T>>
  : T extends Array<infer U> ? TQueryOfArray<U>
  : T extends Record<string, any> ? TQueryOfObject<T>
  : never;
