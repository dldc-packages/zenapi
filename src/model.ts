import type { TQueryDef } from './query';

export const VALUE = Symbol('VALUE');
export const TYPE = Symbol('TYPE');

export type TModelAny = IModel<any, any, any>;

export type TModelValue<Model extends TModelAny> = Model[typeof VALUE];
export type TQueryBuilder<Model extends TModelAny> = Model extends IModel<any, any, infer QueryBuilder>
  ? QueryBuilder
  : never;

export interface IModel<Value, Provided, QueryBuilder> {
  readonly [VALUE]: Value;
  builder(parentDef: TQueryDef): QueryBuilder;
  resolve(provided: Provided): Value;
}
