import { InvalidQuery, InvalidResolvedValue, UnresolvedValue } from '../erreur';
import type { IModel, TModelAny, TModelProvided, TQueryBuilder } from '../model';
import { defineModel } from '../model';
import type { IQuery, RESULT, TQueryAny, TQueryDef, TQueryResult } from '../query';
import { createQuery } from '../query';

export const models = {
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

function string(): IModel<string, IQuery<string>, undefined> {
  return defineModel({
    name: 'string',
    builder(parentDef): IQuery<string> {
      return createQuery<string>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      if (typeof value !== 'string') {
        throw InvalidResolvedValue.create();
      }
      return value;
    },
  });
}

function date(): IModel<Date, IQuery<Date>, undefined> {
  return defineModel({
    name: 'date',
    builder(parentDef): IQuery<Date> {
      return createQuery<Date>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      if (!(value instanceof Date)) {
        throw InvalidResolvedValue.create();
      }
      return value;
    },
  });
}

function number(): IModel<number, IQuery<number>, undefined> {
  return defineModel({
    name: 'number',
    builder(parentDef): IQuery<number> {
      return createQuery<number>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      if (typeof value !== 'number') {
        throw InvalidResolvedValue.create();
      }
      return value;
    },
  });
}

function boolean(): IModel<boolean, IQuery<boolean>, undefined> {
  return defineModel({
    name: 'boolean',
    builder(parentDef): IQuery<boolean> {
      return createQuery<boolean>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      if (typeof value !== 'boolean') {
        throw InvalidResolvedValue.create();
      }
      return value;
    },
  });
}

function json<Data>(): IModel<Data, IQuery<Data>, undefined> {
  return defineModel({
    name: 'json',
    builder(parentDef): IQuery<Data> {
      return createQuery<Data>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      return value;
    },
  });
}

function nil(): IModel<null, IQuery<null>, undefined> {
  return defineModel({
    name: 'null',
    builder(parentDef): IQuery<null> {
      return createQuery<null>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      if (value !== 'null') {
        throw InvalidResolvedValue.create();
      }
      return value;
    },
  });
}

export type TNullableQuery<Q extends TQueryAny> = IQuery<Q[RESULT] | null>;

export interface INullableQueryBuilder<Child extends TModelAny> {
  <Q extends TQueryAny>(fn: (inner: TQueryBuilder<Child>) => Q): TNullableQuery<Q>;
  defined: TQueryBuilder<Child>;
}

function nullable<Child extends TModelAny>(
  inner: Child,
): IModel<TModelProvided<Child> | null, INullableQueryBuilder<Child>, { nullable: TQueryDef | false }> {
  return defineModel({
    name: 'nullable',
    builder(parentDef): INullableQueryBuilder<Child> {
      return Object.assign(
        (fn: (inner: TQueryBuilder<Child>) => TQueryAny) => {
          const sub = fn(inner.builder([]));
          return createQuery([...parentDef, { nullable: sub.def }]);
        },
        {
          defined: inner.builder([...parentDef, { nullable: false }]),
        },
      );
    },
    resolve({ value, resolve, ctx, def, defRest }) {
      if (value === null) {
        if (def.nullable === false) {
          throw new Error('Unexpected nullable');
        }
        return null;
      }
      if (def.nullable === false) {
        return resolve(ctx, inner, defRest, value);
      }
      return resolve(ctx, inner, def.nullable, value);
    },
  });
}

function enumMod<Values extends readonly string[]>(
  values: Values,
): IModel<Values[number], IQuery<Values[number]>, undefined> {
  return defineModel({
    name: 'enumeration',
    builder(parentDef) {
      return createQuery<Values[number]>(parentDef);
    },
    resolve({ value }) {
      if (value === undefined) {
        throw UnresolvedValue.create();
      }
      if (!values.includes(value)) {
        throw InvalidResolvedValue.create();
        // throw new Error(`Invalid enum ${value}`);
      }
      return value;
    },
  });
}

export type TModelsRecord = Record<string, TModelAny>;

export type TRecordQueryBuilderInner<Fields extends TModelsRecord> = { [K in keyof Fields]: TQueryBuilder<Fields[K]> };

export interface IRecordQueryBuilder<Fields extends TModelsRecord> {
  (): TRecordQueryBuilderInner<Fields>;
  <Q extends TQueryAny>(fn: (inner: TRecordQueryBuilderInner<Fields>) => Q): Q;
}

function objectMod<Fields extends TModelsRecord>(
  fields: Fields,
): IModel<{ [K in keyof Fields]?: TModelProvided<Fields[K]> }, IRecordQueryBuilder<Fields>, string> {
  return defineModel({
    name: 'object',
    builder(parentDef) {
      return ((fn?: (inner: TRecordQueryBuilderInner<Fields>) => TQueryAny) => {
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
        return createQuery([...parentDef, ...q.def]);
      }) as any;
    },
    resolve({ ctx, def: key, defRest, resolve, value }) {
      if (key in fields === false) {
        throw InvalidQuery.create();
        // throw new Error(`Unknown field ${key}`);
      }
      return resolve(ctx, fields[key], defRest, value?.[key]);
    },
  });
}

export interface IListQueryBuilder<Children extends TModelAny> {
  all<Q extends TQueryAny>(fn: (sub: TQueryBuilder<Children>) => Q): IQuery<TQueryResult<Q>[]>;
  first<Q extends TQueryAny>(fn: (sub: TQueryBuilder<Children>) => Q): IQuery<TQueryResult<Q>>;
  paginate<Q extends TQueryAny>(
    page: number | { page: number; pageSize: number },
    fn: (sub: TQueryBuilder<Children>) => Q,
  ): IQuery<TQueryResult<Q>[]>;
}

export type TListDef =
  | { type: 'all'; select: TQueryDef }
  | { type: 'first'; select: TQueryDef }
  | {
      type: 'paginate';
      page: number | { page: number; pageSize: number };
      select: TQueryDef;
    };

function list<Child extends TModelAny>(
  child: Child,
): IModel<TModelProvided<Child>[], IListQueryBuilder<Child>, TListDef> {
  return defineModel({
    name: 'list',
    builder(parentDef): IListQueryBuilder<Child> {
      return {
        all(fn) {
          const inner = fn(child.builder([]));
          return createQuery([...parentDef, { type: 'all', select: inner.def }]);
        },
        first(fn) {
          const inner = fn(child.builder([]));
          return createQuery([...parentDef, { type: 'first', select: inner.def }]);
        },
        paginate(page, fn) {
          const inner = fn(child.builder([]));
          return createQuery([...parentDef, { type: 'paginate', page, select: inner.def }]);
        },
      };
    },
    resolve() {
      throw new Error('Not implemented');
    },
  });
}

export type TInputQueryBuilder<Input, Result extends TModelAny> = <Q extends TQueryAny>(
  data: Input,
  fn: (sub: TQueryBuilder<Result>) => Q,
) => IQuery<TQueryResult<Q>>;

export interface IInputDef<Input> {
  input: Input;
  select: TQueryDef;
}

function input<Input, Result extends TModelAny>(
  result: Result,
): IModel<TModelProvided<Result>, TInputQueryBuilder<Input, Result>, IInputDef<Input>> {
  return defineModel({
    name: 'input',
    builder(parentDef): TInputQueryBuilder<Input, Result> {
      return (data, select) => {
        const sub = select(result.builder([]));
        return createQuery([...parentDef, { input: data, select: sub.def }]);
      };
    },
    resolve({ ctx, def, resolve, value }) {
      return resolve(ctx, result, def.select, value);
    },
  });
}
