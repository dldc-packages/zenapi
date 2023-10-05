import { defaultResolvers } from './base/resolver';
import type { TOnError } from './context';
import { ApiContext } from './context';
import type { TInstanceAny, TPath } from './entity';
import { INTERNAL, type TEntityAny } from './entity';
import { ZenapiErreur } from './erreur';
import type { TTypedQueryAny, TTypedQueryResult } from './query';
import { queryReader } from './query';
import type { TEntityMiddleware } from './resolver';
import { RESOLVER, type TAbstractResolverFnAny, type TEntityResolverFnAny, type TResolver } from './resolver';

export type TExtendsContext = (ctx: ApiContext) => ApiContext | Promise<ApiContext>;

export type TRunResult<Query extends TTypedQueryAny, ErrorData> =
  | { success: true; result: TTypedQueryResult<Query> }
  | { success: false; error: ErrorData };

export interface IEngine<ErrorData> {
  run: <Q extends TTypedQueryAny>(query: Q, extendsCtx?: TExtendsContext) => Promise<TRunResult<Q, ErrorData>>;
}

export interface IEngineOptions<ErrorData> {
  readonly resolvers: readonly TResolver[];
  readonly schema: TInstanceAny;
  readonly onError: TOnError<ErrorData>;
}

export function engine<ErrorData>({
  resolvers = defaultResolvers,
  schema,
  onError,
}: IEngineOptions<ErrorData>): IEngine<ErrorData> {
  const resolverByAbstract = new Map<string, TAbstractResolverFnAny>();
  const resolverByEntity = new Map<TEntityAny, TEntityResolverFnAny>();

  for (const item of resolvers) {
    if (item[RESOLVER] === 'abstract') {
      if (resolverByAbstract.has(item.abstract.name)) {
        throw ZenapiErreur.DuplicateResolver.create(item.abstract.name);
      }
      resolverByAbstract.set(item.abstract.name, item.resolver);
      continue;
    }
    if (item[RESOLVER] === 'entity') {
      if (resolverByEntity.has(item.entity)) {
        throw ZenapiErreur.DuplicateResolver.create(item.entity[INTERNAL].name);
      }
      const resolverWithMiddlewares: TEntityResolverFnAny = async (ctx, next, instance) => {
        const ctxMid =
          item.middlewares.length === 0
            ? ctx
            : await withNext<TEntityMiddleware, ApiContext, ApiContext>(
                item.middlewares,
                ctx,
                async (middleware, ctx, next) => {
                  return await middleware(ctx, async (ctx) => await next(ctx));
                },
                (ctx) => Promise.resolve(ctx),
              );

        return item.resolver(ctxMid, next, instance);
      };
      resolverByEntity.set(item.entity, resolverWithMiddlewares);
      continue;
    }
    throw ZenapiErreur.UnexpectedReach.create();
  }

  return { run };

  async function run(
    query: TTypedQueryAny,
    extendsCtx?: TExtendsContext,
  ): Promise<TRunResult<TTypedQueryAny, ErrorData>> {
    try {
      const result = await runUnsafe(query, extendsCtx);
      return { success: true, result };
    } catch (error) {
      const errorData = onError(error);
      return { success: false, error: errorData };
    }
  }

  async function runUnsafe(query: TTypedQueryAny, extendsCtx?: TExtendsContext) {
    const path: TPath = [];
    const ctx = ApiContext.create(path, queryReader(query.query), resolve, onError);
    const ctxExtended = extendsCtx ? await extendsCtx(ctx) : ctx;
    return await resolve(schema, ctxExtended);
  }

  async function resolve(instance: TInstanceAny | null, ctx: ApiContext): Promise<any> {
    // abstract
    const [abstract] = ctx.query.maybeReadAbstract();
    if (abstract) {
      const [name, data] = abstract;
      const abstractResolver = resolverByAbstract.get(name);
      if (!abstractResolver) {
        throw ZenapiErreur.UnknownAbstract.create(name);
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

    return withNext<TInstanceAny, ApiContext, any>(
      stack,
      ctx,
      async (instance, ctx, next) => {
        const resolver = resolverByEntity.get(instance.entity);
        if (!resolver) {
          return await next(ctx);
        }
        return await resolver(ctx, async (ctx) => await next(ctx), instance);
      },
      (ctx) => Promise.resolve(ctx.value),
    );

    // return await handleNext(stack.length - 1, ctx);

    // async function handleNext(index: number, ctx: ApiContext): Promise<any> {
    //   if (index < 0) {
    //     return ctx.value;
    //   }
    //   const instance = stack[index];
    //   const resolver = resolverByEntity.get(instance.entity);
    //   if (!resolver) {
    //     return await handleNext(index - 1, ctx);
    //   }
    //   return await resolver(ctx, async (ctx) => await handleNext(index - 1, ctx), instance);
    // }
  }
}

async function withNext<Item, Data, Result>(
  items: readonly Item[],
  initData: Data,
  onItem: (item: Item, data: Data, next: (data: Data) => Promise<Result>) => Promise<Result>,
  base: (data: Data) => Promise<Result>,
): Promise<Result> {
  const queue = items.slice();

  return await handleNext(queue.length - 1, initData);

  async function handleNext(index: number, data: Data): Promise<Result> {
    if (index < 0) {
      return await base(data);
    }
    const item = queue[index];
    return await onItem(item, data, async (data) => await handleNext(index - 1, data));
  }
}
