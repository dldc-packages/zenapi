import type { IEntity, TEntityAny, TEntityResolved, TQueryBuilder } from '../entity';
import { defineEntity } from '../entity';
import type { ITypedQuery, RESULT, TTypedQueryAny, TTypedQueryResult } from '../query';
import { createQuery } from '../query';
import type { TEntityRecord } from './type';
import { types } from './type';

function string(): IEntity<string, ITypedQuery<string>, null> {
  return defineEntity({
    name: 'string',
    type: types.string,
    typeData: null,
    builder(parentDef): ITypedQuery<string> {
      return createQuery<string>(parentDef);
    },
  });
}

function date(): IEntity<Date, ITypedQuery<Date>, null> {
  return defineEntity({
    name: 'date',
    type: types.date,
    typeData: null,
    builder(parentDef): ITypedQuery<Date> {
      return createQuery<Date>(parentDef);
    },
  });
}

function number(): IEntity<number, ITypedQuery<number>, null> {
  return defineEntity({
    name: 'number',
    type: types.number,
    typeData: null,
    builder(parentDef): ITypedQuery<number> {
      return createQuery<number>(parentDef);
    },
  });
}

function boolean(): IEntity<boolean, ITypedQuery<boolean>, null> {
  return defineEntity({
    name: 'boolean',
    type: types.boolean,
    typeData: null,
    builder(parentDef): ITypedQuery<boolean> {
      return createQuery<boolean>(parentDef);
    },
  });
}

function json<Data>(): IEntity<Data, ITypedQuery<Data>, null> {
  return defineEntity({
    name: 'json',
    type: types.json,
    typeData: null,
    builder(parentDef): ITypedQuery<Data> {
      return createQuery<Data>(parentDef);
    },
  });
}

function nil(): IEntity<null, ITypedQuery<null>, null> {
  return defineEntity({
    name: 'null',
    type: types.nil,
    typeData: null,
    builder(parentDef): ITypedQuery<null> {
      return createQuery<null>(parentDef);
    },
  });
}

function enumMod<Values extends readonly string[]>(
  values: Values,
): IEntity<Values[number], ITypedQuery<Values[number]>, readonly string[]> {
  return defineEntity({
    name: 'enum',
    type: types.enum,
    typeData: values,
    builder(parentDef) {
      return createQuery(parentDef);
    },
  });
}

export type TNullableQuery<Q extends TTypedQueryAny> = ITypedQuery<Q[RESULT] | null>;

export interface INullableQueryBuilder<Child extends TEntityAny> {
  <Q extends TTypedQueryAny>(fn: (inner: TQueryBuilder<Child>) => Q): TNullableQuery<Q>;
  defined: TQueryBuilder<Child>;
}

function nullable<Child extends TEntityAny>(
  inner: Child,
): IEntity<TEntityResolved<Child> | null, INullableQueryBuilder<Child>, TEntityAny> {
  return defineEntity({
    name: 'nullable',
    type: types.nullable,
    typeData: inner,
    builder(parentDef): INullableQueryBuilder<Child> {
      return Object.assign(
        (fn: (inner: TQueryBuilder<Child>) => TTypedQueryAny) => {
          const sub = fn(inner.builder([]));
          return createQuery([...parentDef, { nullable: sub.query }]);
        },
        {
          defined: inner.builder([...parentDef, { nullable: false }]),
        },
      );
    },
  });
}

export type TRecordQueryBuilderInner<Fields extends TEntityRecord> = { [K in keyof Fields]: TQueryBuilder<Fields[K]> };

export interface IRecordQueryBuilder<Fields extends TEntityRecord> {
  (): TRecordQueryBuilderInner<Fields>;
  <Q extends TTypedQueryAny>(fn: (inner: TRecordQueryBuilderInner<Fields>) => Q): Q;
}

export type TObjectResolved<Fields extends TEntityRecord> = { [K in keyof Fields]?: TEntityResolved<Fields[K]> };

function objectMod<Fields extends TEntityRecord>(
  fields: Fields,
): IEntity<TObjectResolved<Fields>, IRecordQueryBuilder<Fields>, TEntityRecord> {
  return defineEntity({
    name: 'object',
    type: types.object,
    typeData: fields,
    builder(parentDef) {
      return ((fn?: (inner: TRecordQueryBuilderInner<Fields>) => TTypedQueryAny) => {
        if (!fn) {
          const inner: Record<string, any> = {};
          for (const [key, child] of Object.entries(fields)) {
            inner[key] = child.builder([...parentDef, key]);
          }
          return inner;
        }
        const inner: Record<string, any> = {};
        for (const [key, child] of Object.entries(fields)) {
          inner[key] = child.builder([key]);
        }
        const q = fn(inner as TRecordQueryBuilderInner<Fields>);
        return createQuery([...parentDef, ...q.query]);
      }) as any;
    },
  });
}

export interface IListQueryBuilder<Children extends TEntityAny> {
  all<Q extends TTypedQueryAny>(fn: (sub: TQueryBuilder<Children>) => Q): ITypedQuery<TTypedQueryResult<Q>[]>;
  first<Q extends TTypedQueryAny>(fn: (sub: TQueryBuilder<Children>) => Q): ITypedQuery<TTypedQueryResult<Q>>;
  paginate<Q extends TTypedQueryAny>(
    page: number | { page: number; pageSize: number },
    fn: (sub: TQueryBuilder<Children>) => Q,
  ): ITypedQuery<TTypedQueryResult<Q>[]>;
}

function list<Child extends TEntityAny>(
  child: Child,
): IEntity<TEntityResolved<Child>[], IListQueryBuilder<Child>, TEntityAny> {
  return defineEntity({
    name: 'list',
    type: types.list,
    typeData: child,
    builder(parentDef): IListQueryBuilder<Child> {
      return {
        all(fn) {
          const inner = fn(child.builder([]));
          return createQuery([...parentDef, { type: 'all', select: inner.query }]);
        },
        first(fn) {
          const inner = fn(child.builder([]));
          return createQuery([...parentDef, { type: 'first', select: inner.query }]);
        },
        paginate(page, fn) {
          const inner = fn(child.builder([]));
          return createQuery([...parentDef, { type: 'paginate', page, select: inner.query }]);
        },
      };
    },
  });
}

export type TInputQueryBuilder<Input, Result extends TEntityAny> = <Q extends TTypedQueryAny>(
  data: Input,
  fn: (sub: TQueryBuilder<Result>) => Q,
) => ITypedQuery<TTypedQueryResult<Q>>;

function input<Input, Result extends TEntityAny>(
  result: Result,
): IEntity<TEntityResolved<Result>, TInputQueryBuilder<Input, Result>, TEntityAny> {
  return defineEntity({
    name: 'input',
    type: types.input,
    typeData: result,
    builder(parentDef): TInputQueryBuilder<Input, Result> {
      return (data, select) => {
        const sub = select(result.builder([]));
        return createQuery([...parentDef, { input: data, select: sub.query }]);
      };
    },
  });
}

export const entity = {
  string,
  number,
  boolean,
  nil,
  nullable,
  object: objectMod,
  list,
  input,
  enum: enumMod,
  date,
  json,
} as const;
