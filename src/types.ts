import type { ApiContext } from './context';
import type { TEntityAny, TPath } from './entity';
import type { IQueryReader, TQueryItemEntity } from './query';

export const QUERY = Symbol('DEF');
export const DATA = Symbol('DATA');

export type TEntityTypeAny = IEntityType<any, any>;

export interface IEntityType<Data, Query extends TQueryItemEntity> {
  readonly [QUERY]: Query;
  readonly [DATA]: Data;
  readonly name: string;
}

export function defineType<Data, Query extends TQueryItemEntity>(name: string): IEntityType<Data, Query> {
  return { [QUERY]: null as any, [DATA]: null as any, name };
}

const TYPE_RESOLVER = Symbol('TYPE_RESOLVER');

export interface IEntityTypeResolver {
  readonly [TYPE_RESOLVER]: true;
  readonly type: TEntityTypeAny;
  readonly resolver: TTypeResolverFnAny;
}

export type TResolveNext = (entity: TEntityAny, ctx: ApiContext, skipType?: boolean) => Promise<any>;

export type TTypeResolverFnAny = TTypeResolverFn<any>;

export type TTypeResolverFn<Data> = (ctx: ApiContext, entity: TEntityAny, data: Data) => any;

export function typeResolver<Data, Def extends TQueryItemEntity>(
  type: IEntityType<Data, Def>,
  resolver: TTypeResolverFn<Data>,
): IEntityTypeResolver {
  return { [TYPE_RESOLVER]: true, type, resolver };
}

/**
 * Abstract
 * These types are only used on the query level, not on the schema (obj, errorBoundary)
 */

const QUERY_DATA = Symbol('DATA');

export type TAbstractAny = IAbstract<any>;

export interface IAbstract<QueryData> {
  readonly [QUERY_DATA]: QueryData;
  readonly name: string;
}

export function defineAbstract<QueryData>(name: string): IAbstract<QueryData> {
  return {
    [QUERY_DATA]: null as any,
    name,
  };
}

const ABSTRACT_RESOLVER = Symbol('ABSTRACT_RESOLVER');

export interface IAbstractResolver {
  readonly [ABSTRACT_RESOLVER]: true;
  readonly abstract: TAbstractAny;
  readonly resolver: TAbstractResolverFnAny;
}

export interface IAbstractResolverParams<Data> {
  readonly path: TPath;
  readonly data: Data;
  readonly ctx: ApiContext;
  readonly value: unknown | undefined;
  readonly entity: TEntityAny;
  readonly query: IQueryReader;
  readonly resolve: TResolveNext;
}

export type TAbstractResolverFnAny = TAbstractResolverFn<any>;

export type TAbstractResolverFn<Data> = (params: IAbstractResolverParams<Data>) => any;

export function abstractResolver<Data>(
  abstract: IAbstract<Data>,
  resolver: TAbstractResolverFn<Data>,
): IAbstractResolver {
  return { [ABSTRACT_RESOLVER]: true, abstract, resolver };
}
