import { defineAbstract } from '../abstract';
import type { IQuery, TQueryAny, TQueryDef, TQueryResult } from '../query';
import { createQuery } from '../query';

export type TAbstractObjectDef = Record<string, TQueryDef>;

export type TQueryRecord = Record<string, TQueryAny>;

export type TQueryRecordResult<Q extends TQueryRecord> = {
  [K in keyof Q]: Q[K] extends TQueryAny ? TQueryResult<Q[K]> : never;
};

const objectAbstract = defineAbstract<TAbstractObjectDef>({
  name: 'object',
  resolve: async ({ resolve, def, ctx, model, value, path }) => {
    const result: Record<string, any> = {};
    for (const [key, subDef] of Object.entries(def)) {
      result[key] = await resolve(ctx, model, path, subDef as any, value);
    }
    return result;
  },
});

export type TSimplify<T> = { [K in keyof T]: T[K] } & {};

export function obj<Query extends TQueryRecord>(obj: Query): IQuery<TSimplify<TQueryRecordResult<Query>>> {
  const select: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    select[key] = value.def;
  }
  return createQuery([['object', select]]);
}

export type TAbstractErrorBoundaryResult<Q extends TQueryAny> =
  | { success: true; result: TQueryResult<Q> }
  | { success: false; error: unknown };

const errorBoundaryAbstract = defineAbstract<TQueryDef>({
  name: 'errorBoundary',
  async resolve({ ctx, resolve, value, path, model, def }) {
    try {
      const result = await resolve(ctx, model, path, def, value);
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  },
});

export function errorBoundary<Q extends TQueryAny>(query: Q): IQuery<TAbstractErrorBoundaryResult<Q>> {
  return createQuery([errorBoundaryAbstract.createDef(query.def)]);
}

export const abstracts = [objectAbstract, errorBoundaryAbstract];
