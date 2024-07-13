import type { Primitive } from "../utils/types.ts";
import type { RESULT, TO_JSON } from "./constants.ts";

export type TWithNullable<Base, Result extends TQueryAny> = Base extends null
  ? TQueryBase<Result[typeof RESULT] | null>
  : Result;

export type TQueryAny = TQueryBase<any>;

export type TQueryDef = any[];

export type TVariables = unknown[];

export interface TQueryBase<Result> {
  [RESULT]: Result;
  [TO_JSON]: [TQueryDef, TVariables];
}

export interface TQueryOfObjectSelectFn<Base, ParentNullable extends boolean> {
  <T extends TQueryAny>(
    select: (current: TQueryOf<NonNullable<Base>, false>) => T,
  ): ParentNullable extends true ? TQueryBase<T[typeof RESULT] | null>
    : TQueryBase<T[typeof RESULT]>;
}

export type TQueryOfObject<
  T extends Record<string, any>,
  ParentNullable extends boolean,
> =
  & TQueryBase<null>
  & { [K in keyof T]-?: TQueryOfNested<T[K], ParentNullable> }
  & { _: TQueryOfObjectSelectFn<T, ParentNullable> };

export interface TQueryOfArray<T, ParentNullable extends boolean>
  extends TQueryBase<null> {
  _: TQueryArraySelectFn<T, ParentNullable>;
}

export interface TQueryArraySelectFn<Item, ParentNullable extends boolean> {
  <T extends TQueryAny>(
    select: (current: TQueryOfNested<Item, ParentNullable>) => T,
  ): TQueryBase<T[typeof RESULT][]>;
}

// Check if the type contains null or undefined

// Utility type to check if a type T contains null
type IsNull<T> = null extends T ? true : false;
// Utility type to check if a type T contains undefined
type IsUndefined<T> = undefined extends T ? true : false;
// Combined utility type to check if a type T contains null or undefined
type IsNil<T> = IsNull<T> extends true ? true
  : IsUndefined<T> extends true ? true
  : false;

export type TQueryOfNested<
  T,
  ParentNullable extends boolean,
> = ParentNullable extends true ? TQueryOf<NonNullable<T>, true>
  : IsNil<T> extends true ? TQueryOf<NonNullable<T>, true>
  : TQueryOf<T, false>;

export type TQueryOf<T, Nullable extends boolean> = T extends Primitive
  ? TQueryBase<Nullable extends true ? T | null : T>
  : T extends (...args: any) => any
    ? (...args: Parameters<T>) => TQueryOfNested<ReturnType<T>, Nullable>
  : T extends Array<infer U> ? TQueryOfArray<U, Nullable>
  : T extends Record<string, any> ? TQueryOfObject<T, Nullable>
  : never;
