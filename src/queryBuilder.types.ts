import type { TypesRecord, ZenTypeAny, ZenTypeFunc, ZenTypeList, ZenTypeOutput, ZenTypeRecord } from './ZenType.types';

const RESULT = Symbol('RESULT');
type RESULT = typeof RESULT;

export interface Query<Result> {
  readonly query: any;
  readonly [RESULT]: Result;
}

export type QueryAny = Query<any>;

export type QueryResult<Q extends Query<any>> = Q[RESULT];

export type QueryBuilder<Type extends ZenTypeAny> = Type extends ZenTypeList<infer Children>
  ? QueryBuilder<Children>
  : Type extends ZenTypeRecord<infer Fields>
  ? QueryBuilderRecord<Fields>
  : Type extends ZenTypeFunc<any, infer Result>
  ? QueryBuilderFunc<Result>
  : Query<ZenTypeOutput<Type>>;

export type QuerySelect = QueryAny | Record<string, QueryAny>;

export type QuerySelectResult<Q extends QuerySelect> = Q extends Query<infer Result>
  ? Result
  : { [K in keyof Q]: QuerySelectResult<Q[K]> };

export type QueryBuilderRecord<Fields extends TypesRecord> = <Q extends QuerySelect>(
  fn: (sub: { [K in keyof Fields]: QueryBuilder<Fields[K]> }) => Q,
) => Query<QuerySelectResult<Q>>;

export type QueryBuilderFunc<Result extends ZenTypeAny> = {
  formData: (data: FormData) => QueryBuilder<Result>;
};
