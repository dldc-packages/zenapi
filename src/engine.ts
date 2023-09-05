import { defaultResolvers } from './base/resolver';
import { ApiContext } from './context';
import type { TInstanceAny, TPath } from './entity';
import { INTERNAL, type TEntityAny } from './entity';
import { DuplicateResolver, UnexpectedReach, UnknownAbstract } from './erreur';
import type { TTypedQueryAny, TTypedQueryResult } from './query';
import { queryReader } from './query';
import { RESOLVER, type TAbstractResolverFnAny, type TEntityResolverFnAny, type TResolver } from './resolver';

export interface IEngine {
  run: <Q extends TTypedQueryAny>(query: Q) => Promise<TTypedQueryResult<Q>>;
}

export interface IEngineOptions {
  resolvers: readonly TResolver[];
  schema: TInstanceAny;
}

export function engine({ resolvers = defaultResolvers, schema }: IEngineOptions): IEngine {
  const resolverByAbstract = new Map<string, TAbstractResolverFnAny>();
  const resolverByEntity = new Map<TEntityAny, TEntityResolverFnAny>();

  for (const item of resolvers) {
    if (item[RESOLVER] === 'abstract') {
      if (resolverByAbstract.has(item.abstract.name)) {
        throw DuplicateResolver.create(item.abstract.name);
      }
      resolverByAbstract.set(item.abstract.name, item.resolver);
      continue;
    }
    if (item[RESOLVER] === 'entity') {
      if (resolverByEntity.has(item.entity)) {
        throw DuplicateResolver.create(item.entity[INTERNAL].name);
      }
      resolverByEntity.set(item.entity, item.resolver);
      continue;
    }
    throw UnexpectedReach.create();
  }

  return { run };

  async function run(query: TTypedQueryAny) {
    const path: TPath = [];
    const ctx = ApiContext.create(path, queryReader(query.query), resolve);
    return await resolve(schema, ctx);
  }

  async function resolve(instance: TInstanceAny | null, ctx: ApiContext): Promise<any> {
    // abstract
    const [abstract] = ctx.query.maybeReadAbstract();
    if (abstract) {
      const [name, data] = abstract;
      const abstractResolver = resolverByAbstract.get(name);
      if (!abstractResolver) {
        throw UnknownAbstract.create(name);
      }
      return abstractResolver(ctx, async (ctx) => resolve(instance, ctx), data);
    }
    // Not an abstract, resolve entity
    if (instance === null) {
      // nothing to resolve
      return undefined;
    }

    const stack: TInstanceAny[] = [];
    let current: TInstanceAny | null = instance;
    while (current !== null) {
      stack.push(current);
      current = current.parent;
    }

    return await handleNext(stack.length - 1, ctx);

    async function handleNext(index: number, ctx: ApiContext): Promise<any> {
      if (index < 0) {
        return ctx.value;
      }
      const instance = stack[index];
      const resolver = resolverByEntity.get(instance.entity);
      if (!resolver) {
        return await handleNext(index - 1, ctx);
      }
      return await resolver(ctx, async (ctx) => await handleNext(index - 1, ctx), instance);
    }
  }
}
