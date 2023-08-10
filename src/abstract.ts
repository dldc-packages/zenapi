import type { ApiContext } from './context';
import type { TModelAny, TPath, TResolveNext } from './model';
import { DEF } from './model';
import type { TQueryAny, TQueryDef, TQueryDefAbstract, TQueryDefItem } from './query';

export type TAbstractAny = IAbstract<any>;

export interface IResolveAbstractParams<Def> {
  readonly path: TPath;
  readonly ctx: ApiContext;
  readonly def: TQueryDefAbstract<Def>;
  readonly defRest: TQueryDef;
  readonly resolve: TResolveNext;
  readonly value: any;
  readonly model: TModelAny; // current model being resolved
}

export type CreateAny = (...args: any[]) => TQueryAny;

/**
 * Abstract models are models that only exist in the query, not in the schema
 * Example: object, errorBoundary...
 */
export interface IAbstract<Def> {
  readonly [DEF]: Def;
  readonly name: string;
  readonly resolve: (params: IResolveAbstractParams<Def>) => any;
  readonly createDef: (def: Def) => TQueryDefAbstract<Def>;
}

export function defineAbstract<Def>(abs: Omit<IAbstract<Def>, typeof DEF | 'createDef'>): IAbstract<Def> {
  return Object.assign(abs, {
    [DEF]: null as any,
    createDef: (def: Def) => [abs.name, def],
  }) as any;
}

export function isAbstractQueryDef(def: TQueryDefItem): def is TQueryDefAbstract<any> {
  return Array.isArray(def) && def.length === 2 && typeof def[0] === 'string';
}
