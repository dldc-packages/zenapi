import { defineAbstract } from '../abstract';
import type { ITypedQuery, TQuery, TTypedQueryAny, TTypedQueryResult } from '../query';
import { createQuery } from '../query';

export type TAbstractObjectDef = Record<string, TQuery>;

const objectAbstract = defineAbstract<TAbstractObjectDef>('object');

const errorBoundaryAbstract = defineAbstract<TQuery>('errorBoundary');

export const abstracts = {
  object: objectAbstract,
  errorBoundary: errorBoundaryAbstract,
};

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

export type TAbstractErrorBoundaryResult<Q extends TTypedQueryAny, ErrorData> =
  | { success: true; result: TTypedQueryResult<Q> }
  | { success: false; error: ErrorData };

export function errorBoundary<Q extends TTypedQueryAny, ErrorData>(
  query: Q,
): ITypedQuery<TAbstractErrorBoundaryResult<Q, ErrorData>> {
  return createQuery([[abstracts.errorBoundary.name, query.query]]);
}
