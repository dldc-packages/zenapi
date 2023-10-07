import { Key } from '../context';
import { ZenapiErreur } from '../erreur';
import { queryReader } from '../query';
import type { TResolver } from '../resolver';
import { abstractResolver, basicResolver } from '../resolver';
import type { TAbstractErrorBoundaryResult } from './abstract';
import { abstracts } from './abstract';
import type { IInputDef, TNullableDef } from './entity';
import { baseEntity } from './entity';

const stringResolver = basicResolver(baseEntity.string, async (ctx, next) => {
  const ctx1 = await next(ctx);
  if (ctx1.value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  if (typeof ctx1.value !== 'string') {
    throw ZenapiErreur.InvalidResolvedValue.create();
  }
  return ctx1;
});

const numberResolver = basicResolver(baseEntity.number, async (ctx, next) => {
  const ctx1 = await next(ctx);
  if (ctx1.value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  if (typeof ctx1.value !== 'number') {
    throw ZenapiErreur.InvalidResolvedValue.create();
  }
  return ctx1;
});

const booleanResolver = basicResolver(baseEntity.boolean, async (ctx, next) => {
  const ctx1 = await next(ctx);
  if (ctx1.value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  if (typeof ctx1.value !== 'boolean') {
    throw ZenapiErreur.InvalidResolvedValue.create();
  }
  return ctx1;
});

const dateResolver = basicResolver(baseEntity.date, async (ctx, next) => {
  const ctx1 = await next(ctx);
  if (ctx1.value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  if (!(ctx1.value instanceof Date)) {
    throw ZenapiErreur.InvalidResolvedValue.create();
  }
  return ctx1;
});

const jsonResolver = basicResolver(baseEntity.json, async (ctx, next) => {
  const ctx1 = await next(ctx);
  if (ctx1.value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  return ctx1;
});

const nilResolver = basicResolver(baseEntity.nil, async (ctx, next) => {
  const ctx1 = await next(ctx);
  if (ctx1.value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  if (ctx1.value !== null) {
    throw ZenapiErreur.InvalidResolvedValue.create();
  }
  return ctx1;
});

const enumResolver = basicResolver(baseEntity.enum, async (ctx, next, instance) => {
  const ctx1 = await next(ctx);
  const value = ctx1.value as any;
  if (value === undefined) {
    throw ZenapiErreur.UnresolvedValue.create();
  }
  if (!instance.payload.includes(value)) {
    throw ZenapiErreur.InvalidResolvedValue.create();
  }
  return ctx1;
});

const nullableResolver = basicResolver(baseEntity.nullable, async (ctxBase, next, instance) => {
  const ctx = await next(ctxBase);
  const child = instance.payload;
  const [def, defRest] = ctxBase.query.readEntity<TNullableDef>();
  if (ctx.value === null) {
    if (def.nullable === false) {
      throw ZenapiErreur.UnexpectedNullable.create();
    }
    return null;
  }
  if (def.nullable === false) {
    return ctx.resolve(child, ctx.withQuery(defRest));
  }
  return ctx.resolve(child, ctx.withQuery(queryReader(def.nullable)).withPath([...ctxBase.path, 'nullable']));
});

const objectResolver = basicResolver(baseEntity.object, async (ctxBase, next, instance) => {
  const [key, nextQuery] = ctxBase.query.readEntity<string>();
  const ctx = await next(ctxBase);
  const fields = instance.payload;
  if (key in fields === false) {
    throw ZenapiErreur.InvalidQuery.create();
  }
  const value = ctx.value as any;
  return ctx.resolve(
    fields[key],
    ctx
      .withQuery(nextQuery)
      .withPath([...ctx.path, key])
      .withValue(value?.[key]),
  );
});

const listResolver = basicResolver(baseEntity.list, () => {
  throw new Error('Not implemented');
});

export const InputDataKey = Key.create<any>('InputData');

const inputResolver = basicResolver(baseEntity.input, async (ctxBase, next, instance) => {
  const [q] = ctxBase.query.readEntity<IInputDef>();

  const child = instance.payload;
  const ctx = await next(ctxBase.with(InputDataKey.Provider(q.input)));

  return ctx.resolve(child, ctx.withQuery(queryReader(q.select)).withPath([...ctxBase.path, '()']));
});

export const baseResolvers = {
  string: stringResolver,
  date: dateResolver,
  number: numberResolver,
  boolean: booleanResolver,
  json: jsonResolver,
  nil: nilResolver,
  enum: enumResolver,
  nullable: nullableResolver,
  object: objectResolver,
  list: listResolver,
  input: inputResolver,
};

/**
 * Abstracts
 */

const objectAbstractResolver = abstractResolver(abstracts.object, async (ctx, next, data) => {
  const result: Record<string, any> = {};
  for (const [key, subDef] of Object.entries(data)) {
    const keyCtx = await next(ctx.withQuery(queryReader(subDef)));
    result[key] = keyCtx.value;
  }
  return ctx.withValue(result);
});

const errorBoundaryAbstractResolver = abstractResolver(abstracts.errorBoundary, async (ctx, next, data) => {
  try {
    const resultCtx = await next(ctx.withQuery(queryReader(data)));
    const result: TAbstractErrorBoundaryResult<any, any> = { success: true, result: resultCtx.value };
    return ctx.withValue(result);
  } catch (error) {
    const errorData = ctx.onError(error);
    const result: TAbstractErrorBoundaryResult<any, any> = { success: false, error: errorData };
    return ctx.withValue(result);
  }
});

export const abstractResolvers = {
  object: objectAbstractResolver,
  errorBoundary: errorBoundaryAbstractResolver,
};

export const defaultResolvers: readonly TResolver[] = [
  ...Object.values(baseResolvers),
  ...Object.values(abstractResolvers),
];
