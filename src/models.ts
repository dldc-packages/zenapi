import type { IModel, TModelAny, TModelProvided, TModelValue, TQueryBuilder } from './model';
import { model } from './model';
import type { IQuery, TQueryAny, TQueryDef, TQueryResult } from './query';
import { createQuery } from './query';

export function string(): IModel<string, string, IQuery<string>, undefined> {
  return model({
    name: 'string',
    builder(parentDef): IQuery<string> {
      return createQuery<string>(parentDef);
    },
    resolve({ value }) {
      if (typeof value !== 'string') {
        throw new Error('Expected string');
      }
      return value;
    },
  });
}

export function number(): IModel<number, number, IQuery<number>, undefined> {
  return model({
    name: 'number',
    builder(parentDef): IQuery<number> {
      return createQuery<number>(parentDef);
    },
  });
}

export function boolean(): IModel<boolean, boolean, IQuery<boolean>, undefined> {
  return model({
    name: 'boolean',
    builder(parentDef): IQuery<boolean> {
      return createQuery<boolean>(parentDef);
    },
  });
}

export function nil(): IModel<null, null, IQuery<null>, undefined> {
  return model({
    name: 'null',
    builder(parentDef): IQuery<null> {
      return createQuery<null>(parentDef);
    },
  });
}

export type TModelsRecord = Record<string, TModelAny>;

export type TRecordQueryBuilder<Fields extends TModelsRecord> = { [K in keyof Fields]: TQueryBuilder<Fields[K]> };

export function record<Children extends TModelsRecord>(
  fields: Children,
): IModel<
  { [K in keyof Children]: TModelValue<Children[K]> },
  { [K in keyof Children]?: TModelProvided<Children[K]> },
  TRecordQueryBuilder<Children>,
  string
> {
  return model({
    name: 'record',
    builder(parentDef) {
      const result: Record<string, any> = {};
      for (const [key, child] of Object.entries(fields)) {
        result[key] = child.builder([...parentDef, key]);
      }
      return result as any;
    },
    resolve({ ctx, def: key, defRest, resolve, value }) {
      if (key in fields === false) {
        throw new Error(`Unknown field ${key}`);
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

export function list<Child extends TModelAny>(
  child: Child,
): IModel<TModelValue<Child>[], TModelProvided<Child>[], IListQueryBuilder<Child>, TListDef> {
  return model({
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

export function input<Input, Result extends TModelAny>(
  result: Result,
): IModel<TModelValue<Result>, TModelProvided<Result>, TInputQueryBuilder<Input, Result>, IInputDef<Input>> {
  return model({
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

export function enumeration<Values extends readonly string[]>(
  values: Values,
): IModel<Values[number], Values[number], IQuery<Values[number]>, undefined> {
  return model({
    name: 'enumeration',
    builder(parentDef) {
      return createQuery<Values[number]>(parentDef);
    },
    resolve() {
      throw new Error('Not implemented');
    },
  });
}
