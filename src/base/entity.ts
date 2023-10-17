import type { IInstance, TInstanceAny, TInstanceResolved, TLeafInstance, TQueryBuilder } from '../entity';
import { defineEntity, resolveBuilder } from '../entity';
import type { ITypedQuery, RESULT, TQuery, TTypedQueryAny, TTypedQueryResult } from '../query';
import { createQuery } from '../query';

export type TNullableDef = { nullable: TQuery | false };

export interface IInputDef {
  input: any;
  select: TQuery;
}

export type TListDef =
  | { type: 'all'; select: TQuery }
  | { type: 'first'; select: TQuery }
  | { type: 'paginate'; select: TQuery; page: number; pageSize: number | null };

export const baseEntity = (() => {
  const stringBase = defineEntity<string, never, null>('base.string');
  const numberBase = defineEntity<number, never, null>('base.number');
  const booleanBase = defineEntity<boolean, never, null>('base.boolean');
  const nilBase = defineEntity<null, never, null>('base.nil');
  const dateBase = defineEntity<Date, never, null>('base.date');
  const jsonBase = defineEntity<unknown, never, null>('base.json');
  const enumBase = defineEntity<string, never, readonly string[]>('base.enum');
  const nullableBase = defineEntity<any, never, TInstanceAny>('base.nullable');
  const objectBase = defineEntity<Record<string, any>, never, TInstanceRecord>('base.object');
  const listBase = defineEntity<readonly any[], never, TInstanceAny>('base.list');
  const inputBase = defineEntity<any, never, TInstanceAny>('base.input');

  return {
    string: stringBase,
    number: numberBase,
    boolean: booleanBase,
    nil: nilBase,
    date: dateBase,
    json: jsonBase,
    enum: enumBase,
    nullable: nullableBase,
    object: objectBase,
    list: listBase,
    input: inputBase,
  };
})();

function string(): TLeafInstance<string> {
  return defineEntity<string, ITypedQuery<string>, null>(
    'string',
    (parentDef): ITypedQuery<string> => createQuery<string>(parentDef),
    () => baseEntity.string(null),
  )(null);
}

function number(): TLeafInstance<number> {
  return defineEntity<number, ITypedQuery<number>, null>(
    'number',
    (parentDef): ITypedQuery<number> => createQuery<number>(parentDef),
    () => baseEntity.number(null),
  )(null);
}

function boolean(): TLeafInstance<boolean> {
  return defineEntity<boolean, ITypedQuery<boolean>, null>(
    'boolean',
    (parentDef): ITypedQuery<boolean> => createQuery<boolean>(parentDef),
    () => baseEntity.boolean(null),
  )(null);
}

function nil(): TLeafInstance<null> {
  return defineEntity<null, ITypedQuery<null>, null>(
    'nil',
    (parentDef): ITypedQuery<null> => createQuery<null>(parentDef),
    () => baseEntity.nil(null),
  )(null);
}

function date(): TLeafInstance<Date> {
  return defineEntity<Date, ITypedQuery<Date>, null>(
    'date',
    (parentDef): ITypedQuery<Date> => createQuery<Date>(parentDef),
    () => baseEntity.date(null),
  )(null);
}

function enumEntity<Values extends readonly string[]>(
  values: Values,
): IInstance<Values[number], ITypedQuery<Values[number]>, Values> {
  return defineEntity<Values[number], ITypedQuery<Values[number]>, Values>(
    'enum',
    (parentDef): ITypedQuery<Values[number]> => createQuery<Values[number]>(parentDef),
    () => baseEntity.enum(values),
  )(values);
}

function json<Data>(): TLeafInstance<Data> {
  return defineEntity<Data, ITypedQuery<Data>, null>(
    'json',
    (parentDef): ITypedQuery<Data> => createQuery<Data>(parentDef),
    () => baseEntity.json(null),
  )(null);
}

export type TNullableQuery<Q extends TTypedQueryAny> = ITypedQuery<Q[RESULT] | null>;

export interface INullableQueryBuilder<Child extends TInstanceAny> {
  <Q extends TTypedQueryAny>(fn: (inner: TQueryBuilder<Child>) => Q): TNullableQuery<Q>;
  defined: TQueryBuilder<Child>;
}

export type TNullableInstance<Child extends TInstanceAny> = IInstance<
  TInstanceResolved<Child> | null,
  INullableQueryBuilder<Child>,
  Child
>;

function nullable<Child extends TInstanceAny>(child: Child): TNullableInstance<Child> {
  return defineEntity<TInstanceResolved<Child> | null, INullableQueryBuilder<Child>, Child>(
    'nullable',
    (parentDef): INullableQueryBuilder<Child> => {
      const nullDef: TNullableDef = { nullable: false };
      return Object.assign(
        (fn: (inner: TQueryBuilder<TInstanceAny>) => TTypedQueryAny) => {
          const sub = fn(resolveBuilder(child, []));
          const def: TNullableDef = { nullable: sub.query };
          return createQuery([...parentDef, def]);
        },
        {
          defined: resolveBuilder(child, [...parentDef, nullDef]),
        },
      );
    },
    () => baseEntity.nullable(child),
  )(child);
}

export type TInstanceRecord = Record<string, TInstanceAny>;

export type TObjectQueryBuilderInner<Fields extends TInstanceRecord> = {
  [K in keyof Fields]: TQueryBuilder<Fields[K]>;
};

export interface IObjectQueryBuilder<Fields extends TInstanceRecord> {
  (): TObjectQueryBuilderInner<Fields>;
  <Q extends TTypedQueryAny>(fn: (inner: TObjectQueryBuilderInner<Fields>) => Q): Q;
}

export type TObjectResolved<Fields extends TInstanceRecord> = {
  [K in keyof Fields]?: TInstanceResolved<Fields[K]>;
};

export type TObjectInstance<Fields extends TInstanceRecord> = IInstance<
  TObjectResolved<Fields>,
  IObjectQueryBuilder<Fields>,
  Fields
>;

function objectEntity<Fields extends TInstanceRecord>(fields: Fields): TObjectInstance<Fields> {
  return defineEntity<TObjectResolved<Fields>, IObjectQueryBuilder<Fields>, Fields>(
    'object',
    (parentDef): IObjectQueryBuilder<Fields> => {
      return (fn?: (inner: TObjectQueryBuilderInner<Fields>) => TTypedQueryAny): any => {
        if (!fn) {
          const inner: Record<string, any> = {};
          for (const [key, child] of Object.entries(fields)) {
            inner[key] = resolveBuilder(child, [...parentDef, key]);
          }
          return inner;
        }
        const inner: Record<string, any> = {};
        for (const [key, child] of Object.entries(fields)) {
          inner[key] = resolveBuilder(child, [key]);
        }
        const q = fn(inner as TObjectQueryBuilderInner<Fields>);
        return createQuery([...parentDef, ...q.query]);
      };
    },
    () => baseEntity.object(fields),
  )(fields);
}

export type TNamespaceQueryBuilder<Fields extends TInstanceRecord> = TObjectQueryBuilderInner<Fields>;

export type TNamespaceInstance<Fields extends TInstanceRecord> = IInstance<
  TObjectResolved<Fields>,
  TNamespaceQueryBuilder<Fields>,
  Fields
>;

/**
 * This is tha same as object except the builder only exposes direct children.
 * This is meant to be used for object that are not resolved
 */
function namespace<Fields extends TInstanceRecord>(fields: Fields): TNamespaceInstance<Fields> {
  return defineEntity<TObjectResolved<Fields>, TNamespaceQueryBuilder<Fields>, Fields>(
    'object',
    (parentDef): TNamespaceQueryBuilder<Fields> => {
      const inner: Record<string, any> = {};
      for (const [key, child] of Object.entries(fields)) {
        inner[key] = resolveBuilder(child, [...parentDef, key]);
      }
      return inner as any;
    },
    () => baseEntity.object(fields),
  )(fields);
}

export interface IListQueryBuilder<Children extends TInstanceAny> {
  all<Q extends TTypedQueryAny>(fn: (sub: TQueryBuilder<Children>) => Q): ITypedQuery<TTypedQueryResult<Q>[]>;
  first<Q extends TTypedQueryAny>(fn: (sub: TQueryBuilder<Children>) => Q): ITypedQuery<TTypedQueryResult<Q>>;
  // TODO: add maybeFirst
  paginate<Q extends TTypedQueryAny>(
    page: number | { page: number; pageSize: number },
    fn: (sub: TQueryBuilder<Children>) => Q,
  ): ITypedQuery<TTypedQueryResult<Q>[]>;
}

export type TListInstance<Child extends TInstanceAny> = IInstance<
  TInstanceResolved<Child>[],
  IListQueryBuilder<Child>,
  Child
>;

function list<Child extends TInstanceAny>(child: Child): TListInstance<Child> {
  return defineEntity<TInstanceResolved<Child>[], IListQueryBuilder<Child>, Child>(
    'list',
    (parentDef): IListQueryBuilder<Child> => {
      return {
        all(fn) {
          const inner = fn(resolveBuilder(child, []));
          const listDef: TListDef = { type: 'all', select: inner.query };
          return createQuery([...parentDef, listDef]);
        },
        first(fn) {
          const inner = fn(resolveBuilder(child, []));
          const listDef: TListDef = { type: 'first', select: inner.query };
          return createQuery([...parentDef, listDef]);
        },
        paginate(page, fn) {
          const inner = fn(resolveBuilder(child, []));
          const listDef: TListDef = {
            type: 'paginate',
            select: inner.query,
            page: typeof page === 'number' ? page : page.page,
            pageSize: typeof page === 'number' ? null : page.pageSize,
          };
          return createQuery([...parentDef, listDef]);
        },
      };
    },
    () => baseEntity.list(child),
  )(child);
}

export type TInputQueryBuilder<Input, Result extends TInstanceAny> = <Q extends TTypedQueryAny>(
  data: Input,
  fn: (sub: TQueryBuilder<Result>) => Q,
) => ITypedQuery<TTypedQueryResult<Q>>;

export type TInputInstance<Input, Result extends TInstanceAny> = IInstance<
  TInstanceResolved<Result>,
  TInputQueryBuilder<Input, Result>,
  Result
>;

function input<Input, Result extends TInstanceAny>(result: Result): TInputInstance<Input, Result> {
  return defineEntity<TInstanceResolved<Result>, TInputQueryBuilder<Input, Result>, Result>(
    'input',
    (parentDef): TInputQueryBuilder<Input, Result> => {
      return (data, select) => {
        const sub = select(resolveBuilder(result, []));
        return createQuery([...parentDef, { input: data, select: sub.query }]);
      };
    },
    () => baseEntity.input(result),
  )(result);
}

export const entity = {
  string,
  number,
  boolean,
  nil,
  date,
  enum: enumEntity,
  json,
  nullable,
  object: objectEntity,
  namespace,
  list,
  input,
} as const;
