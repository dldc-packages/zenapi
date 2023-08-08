import type { ApiContext } from './context';
import type { TModelAny, TResolveModel } from './model';
import { DEF } from './model';
import type { TAbstractQueryDef, TQueryAny, TQueryDef, TQueryDefItem } from './query';

export type TAbstractAny = IAbstract<any, CreateAny>;

export interface IResolveAbstractParams<Def> {
  readonly ctx: ApiContext;
  readonly def: TAbstractQueryDef<Def>;
  readonly defRest: TQueryDef;
  readonly resolve: TResolveModel;
  readonly value: any;
  readonly model: TModelAny; // current model being resolved
}

export type CreateAny = (...args: any[]) => TQueryAny;

/**
 * Abstract models are models that only exist in the query, not in the schema
 * Example: object, errorBoundary...
 */
export interface IAbstract<Def, Create extends CreateAny> {
  readonly [DEF]: Def;
  readonly name: string;
  readonly resolve: (params: IResolveAbstractParams<Def>) => any;
  readonly create: Create;
}

export function defineAbstract<Def>(name: string, resolve: (params: IResolveAbstractParams<Def>) => any) {
  return <Create extends CreateAny>(create: Create): IAbstract<Def, Create> => {
    return {
      [DEF]: null as any,
      create,
      name,
      resolve,
    };
  };
}

export function isAbstractQueryDef(def: TQueryDefItem): def is TAbstractQueryDef<any> {
  return Array.isArray(def) && def.length === 2 && typeof def[0] === 'string';
}
