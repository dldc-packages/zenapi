import type { TModelAny, TQueryBuilder } from './model';

export const RESULT = Symbol('RESULT');
export type RESULT = typeof RESULT;

export type TQueryDef = readonly any[];

export interface IQuery<Result> {
  readonly [RESULT]: Result;
  readonly def: TQueryDef;
}

export type TQueryAny = IQuery<any>;
export type TQuerySelect = TQueryAny | Record<string, TQueryAny>;

export type TQueryResult<Q extends TQueryAny> = Q[RESULT];

export type TQuerySelectResult<Q extends TQuerySelect> = Q extends IQuery<infer Result>
  ? Result
  : { [K in keyof Q]: Q[K] extends TQueryAny ? TQueryResult<Q[K]> : never };

export function wrapQuery<Result>(def: TQueryDef): IQuery<Result> {
  return { def, [RESULT]: null as any };
}

export function query<Schema extends TModelAny, Q extends TQuerySelect>(
  schema: Schema,
  fn: (sub: TQueryBuilder<Schema>) => Q,
): IQuery<TQuerySelectResult<Q>> {
  const select = fn(schema.builder([]));
  return wrapQuery(unwrapQuerySelect([], select));
}

export function unwrapQuerySelect(parentDef: TQueryDef, select: TQuerySelect): TQueryDef {
  if (isQuery(select)) {
    return [...parentDef, ...select.def];
  }
  const res: Record<string, any> = {};
  for (const [key, value] of Object.entries(select)) {
    res[key] = unwrapQuerySelect([], value as TQuerySelect);
  }
  return [...parentDef, res];
}

function isQuery(select: TQuerySelect): select is TQueryAny {
  return select && typeof select === 'object' && RESULT in select;
}
