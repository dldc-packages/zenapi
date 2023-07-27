import type { IModel, TModelAny, TModelValue, TQueryBuilder } from './model';
import { VALUE } from './model';
import type { IQuery, TQuerySelect, TQuerySelectResult } from './query';
import { unwrapQuerySelect, wrapQuery as wrapDef, wrapQuery } from './query';

export function string(): IModel<string, string, IQuery<string>> {
  return {
    [VALUE]: null as any,
    builder(parentDef): IQuery<string> {
      return wrapDef<string>(parentDef);
    },
    resolve(provided: string): string {
      throw new Error('Not implemented');
    },
  };
}

export function number(): IModel<number, number, IQuery<number>> {
  return {
    [VALUE]: null as any,
    builder(parentDef): IQuery<number> {
      return wrapDef<number>(parentDef);
    },
    resolve(provided: number): number {
      throw new Error('Not implemented');
    },
  };
}

export function boolean(): IModel<boolean, boolean, IQuery<boolean>> {
  return {
    [VALUE]: null as any,
    builder(parentDef): IQuery<boolean> {
      return wrapDef<boolean>(parentDef);
    },
    resolve(provided: boolean): boolean {
      throw new Error('Not implemented');
    },
  };
}

export function nil(): IModel<null, null, IQuery<null>> {
  return {
    [VALUE]: null as any,
    builder(parentDef): IQuery<null> {
      return wrapDef<null>(parentDef);
    },
    resolve(provided: null): null {
      throw new Error('Not implemented');
    },
  };
}

export type TModelsRecord = Record<string, TModelAny>;

export type TRecordQueryBuilder<Fields extends TModelsRecord> = { [K in keyof Fields]: TQueryBuilder<Fields[K]> };

export function record<Children extends TModelsRecord>(
  fields: Children,
): IModel<
  { [K in keyof Children]: TModelValue<Children[K]> },
  { [K in keyof Children]?: TModelValue<Children[K]> },
  TRecordQueryBuilder<Children>
> {
  return {
    [VALUE]: null as any,
    builder(parentDef) {
      const result: Record<string, any> = {};
      for (const [key, child] of Object.entries(fields)) {
        result[key] = child.builder([...parentDef, key]);
      }
      return result as any;
    },
    resolve(provided) {
      throw new Error('Not implemented');
    },
  };
}

export interface IListQueryBuilder<Children extends TModelAny> {
  all<Q extends TQuerySelect>(fn: (sub: TQueryBuilder<Children>) => Q): IQuery<TQuerySelectResult<Q>[]>;
  first<Q extends TQuerySelect>(fn: (sub: TQueryBuilder<Children>) => Q): IQuery<TQuerySelectResult<Q>>;
  paginate<Q extends TQuerySelect>(
    page: number | { page: number; pageSize: number },
    fn: (sub: TQueryBuilder<Children>) => Q,
  ): IQuery<TQuerySelectResult<Q>[]>;
}

export function list<Child extends TModelAny>(
  child: Child,
): IModel<TModelValue<Child>[], TModelValue<Child>[], IListQueryBuilder<Child>> {
  return {
    [VALUE]: null as any,
    builder(parentDef): IListQueryBuilder<Child> {
      return {
        all(fn) {
          const inner = fn(child.builder([]));
          const selected = unwrapQuerySelect([...parentDef, 'all'], inner);
          return wrapQuery(selected);
        },
        first(fn) {
          throw new Error('Not implemented');
        },
        paginate(page, fn) {
          const inner = fn(child.builder([]));
          const selected = unwrapQuerySelect([...parentDef, page], inner);
          return wrapQuery(selected);
        },
      };
    },
    resolve(provided) {
      throw new Error('Not implemented');
    },
  };
}

export type TFuncQueryBuilder<Input, Result extends TModelAny> = <Q extends TQuerySelect>(
  data: Input,
  fn: (sub: TQueryBuilder<Result>) => Q,
) => IQuery<TQuerySelectResult<Q>>;

export function func<Input, Result extends TModelAny>(
  result: Result,
): IModel<TModelValue<Result>, TModelValue<Result>, TFuncQueryBuilder<Input, Result>> {
  return {
    [VALUE]: null as any,
    builder(parentDef): TFuncQueryBuilder<Input, Result> {
      return (data, select) => {
        const withInput = [...parentDef, data];
        const selected = select(result.builder([]));
        return wrapQuery(unwrapQuerySelect(withInput, selected));
      };
    },
    resolve(provided) {
      throw new Error('Not implemented');
    },
  };
}

export function enumeration<Values extends readonly string[]>(
  values: Values,
): IModel<Values[number], Values[number], IQuery<Values[number]>> {
  return {
    [VALUE]: null as any,
    builder(parentDef) {
      return wrapDef<Values[number]>(parentDef);
    },
    resolve(provided) {
      throw new Error('Not implemented');
    },
  };
}
