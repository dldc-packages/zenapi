import type { TFormiFieldTree, TFormiFieldTreeValue } from '@dldc/formi';
import type { TypesRecord, ZenTypeAny, ZenTypeFunc, ZenTypeList, ZenTypeOutput, ZenTypeRecord } from './ZenType.types';

export const RESULT = Symbol('RESULT');
export type RESULT = typeof RESULT;

export const PARENT = Symbol('PARENT');
export type PARENT = typeof PARENT;

export interface Query<Result> {
  readonly def: QueryDefAny | null;
  readonly [RESULT]: Result;
}

export type QueryAny = Query<any>;

export type QueryResult<Q extends QueryAny> = Q[RESULT];

export type QuerySelect = QueryAny | Record<string, QueryAny>;

export type QuerySelectResult<Q extends QuerySelect> = Q extends Query<infer Result>
  ? Result
  : { [K in keyof Q]: Q[K] extends QuerySelect ? QuerySelectResult<Q[K]> : never };

export type QueryBuilder<Type extends ZenTypeAny> = Type extends ZenTypeRecord<infer Fields>
  ? QueryBuilderRecord<Fields>
  : Type extends ZenTypeFunc<infer Fields, infer Result>
  ? QueryBuilderFunc<Fields, Result>
  : Type extends ZenTypeList<infer Children>
  ? QueryBuilderList<Children>
  : Query<ZenTypeOutput<Type>>;

export type QueryBuilderRecord<Fields extends TypesRecord> = { [K in keyof Fields]: QueryBuilder<Fields[K]> };

export type QueryBuilderFuncSub<Result extends ZenTypeAny> = {
  select: <Q extends QuerySelect>(fn: (sub: QueryBuilder<Result>) => Q) => Query<QuerySelectResult<Q>>;
};

export type QueryBuilderFunc<Fields extends TFormiFieldTree, Result extends ZenTypeAny> = {
  formData: (data: FormData) => QueryBuilderFuncSub<Result>;
  json: (data: TFormiFieldTreeValue<Fields>) => QueryBuilderFuncSub<Result>;
};

export type QueryBuilderList<Children extends ZenTypeAny> = {
  all<Q extends QuerySelect>(fn: (sub: QueryBuilder<Children>) => Q): Query<QuerySelectResult<Q>[]>;
  first<Q extends QuerySelect>(fn: (sub: QueryBuilder<Children>) => Q): Query<QuerySelectResult<Q>>;
  paginate<Q extends QuerySelect>(
    page: number | { page: number; pageSize: number },
    fn: (sub: QueryBuilder<Children>) => Q,
  ): Query<QuerySelectResult<Q>[]>;
};

export type QueryDefAny = QueryDefProperty | QueryDefSelect | QueryDefFunc | QueryDefList;

export type QueryDefListOptions =
  | { kind: 'page'; page: number; pageSize: number }
  | { kind: 'first' }
  | { kind: 'last' }
  | { kind: 'maybeFirst' }
  | { kind: 'limit'; limit: number; offset: number };

export interface QueryDefProperty {
  readonly [PARENT]: QueryDefAny | null;
  readonly kind: 'property';
  readonly property: string;
}

export interface QueryDefSelect {
  readonly [PARENT]: null;
  readonly kind: 'select';
  readonly select: Record<string, QueryAny>;
}

export interface QueryDefFunc {
  readonly [PARENT]: QueryDefAny | null;
  readonly kind: 'func';
  readonly input: { type: 'formdata'; data: FormData } | { type: 'json'; data: any };
}

export interface QueryDefList {
  readonly [PARENT]: null;
  readonly kind: 'list';
  readonly options: QueryDefListOptions;
  readonly children: QueryDefAny;
}
