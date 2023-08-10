import type { ApiContext } from './context';
import type { TQueryDef, TQueryDefModel } from './query';

export const DEF = Symbol('DEF');

export type TPath = readonly (string | number)[];

export type TModelAny = IModel<any, any, any>;

export type TModelValue<Model extends TModelAny> = Model extends IModel<infer Value, any, any> ? Value : never;
export type TModelDef<Model extends TModelAny> = Model[typeof DEF];
export type TQueryBuilder<Model extends TModelAny> = ReturnType<Model['builder']>;

export type TResolveNext = (
  ctx: ApiContext,
  model: TModelAny,
  path: TPath,
  def: TQueryDef,
  value: any | null,
) => Promise<any>;

export interface IResolveParams<Value, Def extends TQueryDefModel> {
  readonly path: TPath;
  readonly ctx: ApiContext;
  readonly value: Value | undefined;
  readonly def: Def;
  readonly defRest: TQueryDef;
  readonly resolve: TResolveNext;
}

export interface IModel<Value, QueryBuilder, Def extends TQueryDefModel> {
  readonly [DEF]: Def;
  readonly name: string;
  readonly builder: (parentDef: TQueryDef) => QueryBuilder;
  readonly resolve?: (params: IResolveParams<Value, Def>) => any;
}

export function defineModel<Value, QueryBuilder, Def extends TQueryDefModel>(
  mod: Omit<IModel<Value, QueryBuilder, Def>, typeof DEF>,
): IModel<Value, QueryBuilder, Def> {
  Object.assign(mod, { [DEF]: null as any });
  return mod as any;
}
