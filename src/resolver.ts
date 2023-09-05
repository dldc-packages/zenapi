import type { IAbstract, TAbstractAny } from './abstract';
import type { ApiContext } from './context';
import type { TEntityAny, TInstanceOf, TResolved } from './entity';

export const RESOLVER = Symbol('RESOLVER');

export type TResolver = IAbstractResolver | IEntityResolver;

export interface IAbstractResolver {
  readonly [RESOLVER]: 'abstract';
  readonly abstract: TAbstractAny;
  readonly resolver: TAbstractResolverFnAny;
}

export type TAbstractResolverFnAny = TAbstractResolverFn<any>;

export type TAbstractResolverFn<Data> = (ctx: ApiContext, next: (ctx: ApiContext) => Promise<any>, data: Data) => any;

export function abstractResolver<Data>(
  abstract: IAbstract<Data>,
  resolver: TAbstractResolverFn<Data>,
): IAbstractResolver {
  return { [RESOLVER]: 'abstract', abstract, resolver };
}

export type TEntityResolverFnAny = TEntityResolverFn<TEntityAny>;

export type TEntityResolverFn<Entity extends TEntityAny> = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<any>, // call next entity (child) of return undefined
  instance: TInstanceOf<Entity>,
) => Promise<TResolved<Entity>> | TResolved<Entity>;

export interface IEntityResolver {
  readonly [RESOLVER]: 'entity';
  readonly entity: TEntityAny;
  readonly resolver: TEntityResolverFnAny;
}

export function resolver<Entity extends TEntityAny>(
  entity: Entity,
  resolverFn: TEntityResolverFn<Entity>,
): IEntityResolver {
  return { [RESOLVER]: 'entity', entity, resolver: resolverFn as any };
}
