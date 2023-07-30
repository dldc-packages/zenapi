import type { TModelAny, TQueryBuilder } from './model';

export const RESULT = Symbol('RESULT');
export type RESULT = typeof RESULT;

// No array as they are reserved for query only def (like object)
export type TModelQueryDef = Record<string, any> | string | number | boolean | null | undefined;

export type TInternalQueryDefObject = readonly ['object', Record<string, TQueryDef>];

export type TQueryDefItem = TInternalQueryDefObject | TModelQueryDef;

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

export const query = Object.assign(queryFn, {
  isQuery,
  object,
});

function queryFn<Schema extends TModelAny, Query extends TQuerySelect>(
  schema: Schema,
  fn: (sub: TQueryBuilder<Schema>) => Query,
): IQuery<TQuerySelectResult<Query>> {
  return object(fn(schema.builder([])));
}

export type TQuerySelect = TQueryAny | Record<string, TQueryAny>;

export type TQuerySelectResult<Q extends TQuerySelect> = Q extends IQuery<infer Result>
  ? Result
  : { [K in keyof Q]: Q[K] extends TQueryAny ? TQueryResult<Q[K]> : never };

function isQuery(select: TQuerySelect): select is TQueryAny {
  return select && typeof select === 'object' && RESULT in select;
}

function object<Query extends TQuerySelect>(obj: Query): IQuery<TQuerySelectResult<Query>> {
  if (isQuery(obj)) {
    return obj;
  }
  const select: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    select[key] = value.def;
  }
  return createQuery([['object', select]]);
}

export function isInternalQueryDefObject(def: TQueryDefItem): def is TInternalQueryDefObject {
  return Array.isArray(def) && def[0] === 'object';
}
