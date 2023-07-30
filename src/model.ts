import type { ApiContext } from './context';
import type { TModelQueryDef, TQueryDef } from './query';

export const VALUE = Symbol('VALUE');
export const DEF = Symbol('DEF');

export type TModelAny = IModel<any, any, any, any>;

export type TModelValue<Model extends TModelAny> = Model[typeof VALUE];
export type TModelProvided<Model extends TModelAny> = Model extends IModel<any, infer Provided, any, any>
  ? Provided
  : never;
export type TModelDef<Model extends TModelAny> = Model[typeof DEF];

export type TQueryBuilder<Model extends TModelAny> = Model extends IModel<any, any, infer QueryBuilder, any>
  ? QueryBuilder
  : never;

export type TResolveModel = (ctx: ApiContext, model: TModelAny, def: TQueryDef, value: any | null) => Promise<any>;

export interface IResolveParams<Provided, Def extends TModelQueryDef> {
  ctx: ApiContext;
  value: Provided | undefined;
  def: Def;
  defRest: TQueryDef;
  resolve: TResolveModel;
}

export interface IModel<Value, Provided, QueryBuilder, Def extends TModelQueryDef> {
  readonly [VALUE]: Value;
  readonly [DEF]: Def;
  readonly name: string;
  readonly builder: (parentDef: TQueryDef) => QueryBuilder;
  readonly resolve?: (params: IResolveParams<Provided, Def>) => any;
}

export function model<Value, Provided, QueryBuilder, Def extends TModelQueryDef>(
  mod: Omit<IModel<Value, Provided, QueryBuilder, Def>, typeof VALUE | typeof DEF>,
): IModel<Value, Provided, QueryBuilder, Def> {
  return mod as any;
}
