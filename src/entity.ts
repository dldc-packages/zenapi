import type { ITypedQuery, TQuery } from './query';

export const INTERNAL = Symbol('INTERNAL');

export type TPath = readonly (string | number)[];

export type TEntityAny = IEntity<any, any, any>;

export type TResolved<Entity extends TEntityAny> = Entity[typeof INTERNAL]['_resolved'];

export type TInstanceResolved<Instance extends TInstanceAny> = Instance['entity'][typeof INTERNAL]['_resolved'];
export type TQueryBuilder<Instance extends TInstanceAny> = Instance['entity'][typeof INTERNAL]['_queryBuilder'];
export type TPayload<Instance extends TInstanceAny> = Instance['entity'][typeof INTERNAL]['_payload'];

export type TQueryBuilderFactory<QueryBuilder, Payload> = (parentDef: TQuery, payload: Payload) => QueryBuilder;
export type TParentEntityFactory<Payload> = (payload: Payload) => TInstanceAny;

export interface IEntity<Resolved, QueryBuilder, Payload> {
  (payload: Payload): IInstance<Resolved, QueryBuilder, Payload>;
  readonly [INTERNAL]: {
    readonly _queryBuilder: QueryBuilder;
    readonly _payload: Payload;
    readonly _resolved: Resolved;
    readonly name: string;
    readonly builder: TQueryBuilderFactory<QueryBuilder, Payload> | null;
    readonly parent: TParentEntityFactory<Payload> | null;
  };
}

export type TInstanceAny = IInstance<any, any, any>;

export type TInstanceOf<Entity extends TEntityAny> = IInstance<
  TResolved<Entity>,
  Entity[typeof INTERNAL]['_queryBuilder'],
  Entity[typeof INTERNAL]['_payload']
>;

export interface IInstance<Resolved, QueryBuilder, Payload> {
  readonly entity: IEntity<Resolved, QueryBuilder, Payload>;
  readonly parent: TInstanceAny | null;
  readonly payload: Payload;
}

export interface IDeferredInstance<Instance extends TInstanceAny>
  extends IInstance<TInstanceResolved<Instance>, TQueryBuilder<Instance>, TPayload<Instance>> {
  define(instance: Instance): void;
}

export type TLeafInstance<T> = IInstance<T, ITypedQuery<T>, null>;

export function defineEntity<Resolved, QueryBuilder, Payload>(
  name: string,
  builder: TQueryBuilderFactory<QueryBuilder, Payload> | null = null,
  parent: TParentEntityFactory<Payload> | null = null,
): IEntity<Resolved, QueryBuilder, Payload> {
  function create(payload?: Payload): IInstance<Resolved, QueryBuilder, Payload> {
    return {
      entity,
      parent: parent ? (parent as any)(payload) : null,
      payload: payload as any,
    };
  }
  const entity: IEntity<Resolved, QueryBuilder, Payload> = Object.assign(create, {
    [INTERNAL]: {
      _queryBuilder: null as any,
      _payload: null as any,
      _resolved: null as any,
      name,
      builder,
      parent,
    },
  });
  return entity;
}

export function deferred<Instance extends TInstanceAny>(debugName: string): IDeferredInstance<Instance> {
  let instance: Instance | null = null;
  return {
    get entity() {
      if (!instance) {
        throw new Error(`Deferred entity ${debugName} is not defined`);
      }
      return instance.entity;
    },
    get parent() {
      if (!instance) {
        throw new Error(`Deferred entity ${debugName} is not defined`);
      }
      return instance.parent;
    },
    get payload() {
      if (!instance) {
        throw new Error(`Deferred entity ${debugName} is not defined`);
      }
      return instance.payload;
    },
    define(def: Instance) {
      if (instance) {
        throw new Error(`Deferred entity ${debugName} is already defined`);
      }
      instance = def;
    },
  };
}

export function resolveBuilder(instance: TInstanceAny, parentDef: TQuery) {
  const builder = instance.entity[INTERNAL].builder;
  if (!builder) {
    throw new Error(`Entity ${instance.entity[INTERNAL].name} has no builder`);
  }
  return builder(parentDef, instance.payload);
}
