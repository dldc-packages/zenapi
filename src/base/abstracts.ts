import { defineAbstract } from '../abstract';
import type { IQuery, TQueryAny, TQueryDef, TQueryResult } from '../query';
import { createQuery } from '../query';

export type TAbstractObjectDef = Record<string, TQueryDef>;

export type TQueryRecord = Record<string, TQueryAny>;

export type TQueryRecordResult<Q extends TQueryRecord> = {
  [K in keyof Q]: Q[K] extends TQueryAny ? TQueryResult<Q[K]> : never;
};

const objectAbstract = defineAbstract<TAbstractObjectDef>('object', async ({ resolve, def, ctx, model, value }) => {
  const result: Record<string, any> = {};
  for (const [key, subDef] of Object.entries(def)) {
    result[key] = await resolve(ctx, model, subDef as any, value);
  }
  return result;
})(function create<Query extends TQueryRecord>(obj: Query): IQuery<TQueryRecordResult<Query>> {
  const select: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    select[key] = value.def;
  }
  return createQuery([['object', select]]);
});

export type TAbstractErrorBoundaryResult<Q extends TQueryAny> =
  | { success: true; result: TQueryResult<Q> }
  | { success: false; error: unknown };

const errorBoundary = defineAbstract<TQueryAny>('errorBoundary', () => {
  throw new Error('TODO');
})(function create<Q extends TQueryAny>(query: Q): IQuery<TAbstractErrorBoundaryResult<Q>> {
  return createQuery([['errorBoundary', query.def]]);
});

export const abstracts = {
  object: objectAbstract,
  errorBoundary,
};

// shortcut
export function obj<Query extends TQueryRecord>(obj: Query): IQuery<TQueryRecordResult<Query>> {
  return objectAbstract.create(obj);
}
