import type { TModelAny, TQueryBuilder } from './model';

export const RESULT = Symbol('RESULT');
export type RESULT = typeof RESULT;

// No array as they are reserved for query only def (like object)
export type TQueryDefModel = Record<string, any> | string | number | boolean | null | undefined;

export type TQueryDefAbstract<Def> = readonly [string, Def];

export type TQueryDefItem = TQueryDefAbstract<any> | TQueryDefModel;

export type TQueryDef = readonly TQueryDefItem[];

export type TQueryAny = IQuery<any>;

export interface IQuery<Result> {
  readonly [RESULT]: Result;
  readonly def: TQueryDef;
}

export type TQueryResult<Q extends TQueryAny> = Q[RESULT];

export function createQuery<Result>(def: TQueryDef): IQuery<Result> {
  return { def, [RESULT]: null as any };
}

export function query<Schema extends TModelAny>(schema: Schema): TQueryBuilder<Schema> {
  return schema.builder([]);
}
