import type { ApiContext } from './context';
import type { TQuery } from './query';
import type { IEntityType } from './types';

export const RESOLVED = Symbol('RESOLVED');

export type TPath = readonly (string | number)[];

export type TEntityAny = IEntity<any, any, any>;

export type TEntityResolved<Entity extends TEntityAny> = Entity extends IEntity<infer Resolved, any, any>
  ? Resolved
  : never;
export type TQueryBuilder<Entity extends TEntityAny> = ReturnType<Entity['builder']>;

/**
 * An entity is like an instance of an type
 */
export interface IEntity<Resolved, QueryBuilder, TypeData> {
  readonly [RESOLVED]: Resolved;
  // base type resolver
  readonly type: IEntityType<TypeData, any>;
  readonly typeData: TypeData;
  readonly name: string;
  readonly builder: (parentDef: TQuery) => QueryBuilder;
}

export function defineEntity<Resolved, QueryBuilder, TypeData>(
  mod: Omit<IEntity<Resolved, QueryBuilder, TypeData>, typeof RESOLVED>,
): IEntity<Resolved, QueryBuilder, TypeData> {
  Object.assign(mod, { [RESOLVED]: null as any });
  return mod as any;
}

const RESOLVER = Symbol('RESOLVER');
type RESOLVER = typeof RESOLVER;

export interface IEntityResolver {
  readonly [RESOLVER]: true;
  readonly entity: TEntityAny;
  readonly resolver: TEntityResolverFn<TEntityAny>;
}

export type TEntityResolverFn<Entity extends TEntityAny> = (
  ctx: ApiContext,
) => Promise<TEntityResolved<Entity>> | TEntityResolved<Entity>;

export function resolver<Entity extends TEntityAny>(
  entity: Entity,
  resolverFn: TEntityResolverFn<Entity>,
): IEntityResolver {
  return { [RESOLVER]: true, entity, resolver: resolverFn as any };
}
