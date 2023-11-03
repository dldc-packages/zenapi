import type { IAbstract, TAbstractAny } from './abstract';
import type { ApiContext } from './context';
import type { TEntityAny, TInstanceOf, TResolved } from './entity';
import { RESOLVER } from './internal';

export type TResolver = IAbstractResolver | IEntityResolver;

export interface IAbstractResolver {
  readonly [RESOLVER]: 'abstract';
  readonly abstract: TAbstractAny;
  readonly resolver: TAbstractResolverFnAny;
}

export type TAbstractResolverFnAny = TAbstractResolverFn<any>;

export type TAbstractResolverFn<Data> = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
  data: Data,
) => Promise<ApiContext> | ApiContext;

export function abstractResolver<Data>(
  abstract: IAbstract<Data>,
  resolver: TAbstractResolverFn<Data>,
): IAbstractResolver {
  return { [RESOLVER]: 'abstract', abstract, resolver };
}

export type TEntityMiddleware = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>,
) => ApiContext | Promise<ApiContext>;

export type TEntityResolverFnAny = TEntityResolverFn<TEntityAny>;

// TODO: We need to be able to return a new ctx when we return the value
// Should we allow to return a new ctx ? What would it mean for the return of next() ?
export type TEntityResolverFn<Entity extends TEntityAny> = (
  ctx: ApiContext,
  next: (ctx: ApiContext) => Promise<ApiContext>, // call next entity (child) or return undefined
  instance: TInstanceOf<Entity>,
) => Promise<TResolved<Entity> | ApiContext> | TResolved<Entity> | ApiContext;

export interface IEntityResolver {
  readonly [RESOLVER]: 'entity';
  readonly entity: TEntityAny;
  readonly middlewares: readonly TEntityMiddleware[];
  readonly resolver: TEntityResolverFnAny;
}

export function resolver<Entity extends TEntityAny>(
  entity: Entity,
  middlewares: readonly TEntityMiddleware[],
  resolverFn: TEntityResolverFn<Entity>,
): IEntityResolver {
  return { [RESOLVER]: 'entity', entity, middlewares, resolver: resolverFn as any };
}

export function basicResolver<Entity extends TEntityAny>(
  entity: Entity,
  resolverFn: TEntityResolverFn<Entity>,
): IEntityResolver {
  return resolver(entity, [], resolverFn);
}
