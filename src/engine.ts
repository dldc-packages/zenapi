import { abstractResolvers as baseAbstractResolvers, typeResolvers as baseTypeResolvers } from './base/resolver';
import { ApiContext } from './context';
import type { TPath } from './entity';
import { type IEntityResolver, type TEntityAny, type TEntityResolverFn } from './entity';
import { CannotResolveType, DuplicateResolver, UnknownAbstract } from './erreur';
import type { IQueryReader, TTypedQueryAny, TTypedQueryResult } from './query';
import { queryReader } from './query';
import type {
  IAbstractResolver,
  IEntityTypeResolver,
  TAbstractResolverFnAny,
  TEntityTypeAny,
  TTypeResolverFnAny,
} from './types';

export interface IEngine {
  run: <Q extends TTypedQueryAny>(query: Q) => Promise<TTypedQueryResult<Q>>;
}

export interface IInternalResolveParams {
  readonly ctx: ApiContext;
  readonly query: IQueryReader;
  readonly entity: TEntityAny;
  readonly value: any;
}

export interface IEngineOptions {
  abstractResolvers?: IAbstractResolver[];
  typeResolvers?: IEntityTypeResolver[];
  schema: TEntityAny;
  entityResolvers: IEntityResolver[];
}

export function engine({
  abstractResolvers = Object.values(baseAbstractResolvers),
  typeResolvers = Object.values(baseTypeResolvers),
  entityResolvers,
  schema,
}: IEngineOptions): IEngine {
  const resolverByAbstract = new Map<string, TAbstractResolverFnAny>();
  for (const item of abstractResolvers) {
    if (resolverByAbstract.has(item.abstract.name)) {
      throw DuplicateResolver.create(abstractResolvers.indexOf(item));
    }
    resolverByAbstract.set(item.abstract.name, item.resolver);
  }

  const resolverByType = new Map<TEntityTypeAny, TTypeResolverFnAny>();
  for (const item of typeResolvers) {
    if (resolverByType.has(item.type)) {
      throw DuplicateResolver.create(typeResolvers.indexOf(item));
    }
    resolverByType.set(item.type, item.resolver);
  }

  const resolverByEntity = new Map<TEntityAny, TEntityResolverFn<TEntityAny>>();
  for (const item of entityResolvers) {
    if (resolverByEntity.has(item.entity)) {
      throw DuplicateResolver.create(entityResolvers.indexOf(item));
    }
    resolverByEntity.set(item.entity, item.resolver);
  }

  return { run };

  async function run(query: TTypedQueryAny) {
    const path: TPath = [];
    const ctx = ApiContext.create(path, queryReader(query.query), internalResolve);
    return await internalResolve(schema, ctx);
  }

  // { ctx, query, path, value, entity }: IInternalResolveParams
  async function internalResolve(entity: TEntityAny, ctx: ApiContext, skipType: boolean = false): Promise<any> {
    // abstract
    const [abstract, nextQuery] = ctx.query.maybeReadAbstract();
    if (abstract) {
      const [name, data] = abstract;
      const abstractResolver = resolverByAbstract.get(name);
      if (!abstractResolver) {
        throw UnknownAbstract.create(name);
      }
      return abstractResolver({
        ctx,
        data,
        entity,
        path: ctx.path,
        query: nextQuery,
        value: ctx.value,
        resolve: internalResolve,
      });
    }

    if (skipType) {
      console.log('resolve entity', entity.name, ctx.value);
      // resolve the actual entity
      return await resolveEntity(entity, ctx.withQuery(nextQuery));
    }

    console.log('resolve type', entity.type.name, ctx.value);
    return resolveType(entity, ctx);
  }

  function resolveType(entity: TEntityAny, ctx: ApiContext): any {
    const typeResolver = resolverByType.get(entity.type);
    if (!typeResolver) {
      throw CannotResolveType.create();
    }
    return typeResolver(ctx, entity, entity.typeData);
  }

  async function resolveEntity(entity: TEntityAny, ctx: ApiContext): Promise<unknown> {
    const value = ctx.value;
    if (value !== undefined) {
      return value;
    }
    const resolver = resolverByEntity.get(entity);
    if (!resolver) {
      return undefined;
    }
    return await resolver(ctx);
  }
}
