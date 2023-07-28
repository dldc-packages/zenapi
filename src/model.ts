import type { TQueryDef } from './query';

export const VALUE = Symbol('VALUE');
export const TYPE = Symbol('TYPE');

export type TModelAny = IModel<any, any, any>;

export type TModelValue<Model extends TModelAny> = Model[typeof VALUE];

export type TModelProvided<Model extends TModelAny> = Model extends IModel<any, infer Provided, any> ? Provided : never;

export type TQueryBuilder<Model extends TModelAny> = Model extends IModel<any, any, infer QueryBuilder>
  ? QueryBuilder
  : never;

export interface IModel<Value, Provided, QueryBuilder> {
  readonly [VALUE]: Value;
  builder(parentDef: TQueryDef): QueryBuilder;
  provide(provided: Provided): Value;
  // given a query definition, return all the direct children models that need to be resolved next
  children(def: TQueryDef): TModelAny[];
}
