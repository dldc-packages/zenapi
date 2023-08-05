import type { ApiContext } from './context';
import type { TModelQueryDef, TQueryDef } from './query';

export const DEF = Symbol('DEF');

export type TModelAny = IModel<any, any, any>;

export type TModelProvided<Model extends TModelAny> = Model extends IModel<infer Provided, any, any> ? Provided : never;
export type TModelDef<Model extends TModelAny> = Model[typeof DEF];

export type TQueryBuilder<Model extends TModelAny> = Model extends IModel<any, infer QueryBuilder, any>
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

export interface IModel<Provided, QueryBuilder, Def extends TModelQueryDef> {
  readonly [DEF]: Def;
  readonly name: string;
  readonly builder: (parentDef: TQueryDef) => QueryBuilder;
  readonly resolve?: (params: IResolveParams<Provided, Def>) => any;
}

export function model<Provided, QueryBuilder, Def extends TModelQueryDef>(
  mod: Omit<IModel<Provided, QueryBuilder, Def>, typeof DEF>,
): IModel<Provided, QueryBuilder, Def> {
  return mod as any;
}
