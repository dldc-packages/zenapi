import type { ITypedQuery, TTypedQueryAny, TTypedQueryResult } from '../query';
import { createQuery } from '../query';
import { abstracts } from './type';

export type TQueryRecord = Record<string, TTypedQueryAny>;

export type TQueryRecordResult<Q extends TQueryRecord> = {
  [K in keyof Q]: Q[K] extends TTypedQueryAny ? TTypedQueryResult<Q[K]> : never;
};

export type TSimplify<T> = { [K in keyof T]: T[K] } & {};

export function obj<Query extends TQueryRecord>(obj: Query): ITypedQuery<TSimplify<TQueryRecordResult<Query>>> {
  const select: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    select[key] = value.query;
  }
  return createQuery([[abstracts.object.name, select]]);
}

export type TAbstractErrorBoundaryResult<Q extends TTypedQueryAny> =
  | { success: true; result: TTypedQueryResult<Q> }
  | { success: false; error: unknown };

export function errorBoundary<Q extends TTypedQueryAny>(query: Q): ITypedQuery<TAbstractErrorBoundaryResult<Q>> {
  return createQuery([[abstracts.errorBoundary.name, query.query]]);
}
