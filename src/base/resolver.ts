import { Key } from '../context';
import { InvalidQuery, InvalidResolvedValue, UnexpectedNullable, UnresolvedValue } from '../erreur';
import { queryReader } from '../query';
import type { TResolver } from '../resolver';
import { abstractResolver, resolver } from '../resolver';
import type { TAbstractErrorBoundaryResult } from './abstract';
import { abstracts } from './abstract';
import type { IInputDef, TNullableDef } from './entity';
import { baseEntity } from './entity';

const stringResolver = resolver(baseEntity.string, async (ctx, next) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (typeof value !== 'string') {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const numberResolver = resolver(baseEntity.number, async (ctx, next) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (typeof value !== 'number') {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const booleanResolver = resolver(baseEntity.boolean, async (ctx, next) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (typeof value !== 'boolean') {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const dateResolver = resolver(baseEntity.date, async (ctx, next) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (!(value instanceof Date)) {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const jsonResolver = resolver(baseEntity.json, async (ctx, next) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  return value;
});

const nilResolver = resolver(baseEntity.nil, async (ctx, next) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (value !== null) {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const enumResolver = resolver(baseEntity.enum, async (ctx, next, instance) => {
  const value = await next(ctx);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (!instance.payload.includes(value)) {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const nullableResolver = resolver(baseEntity.nullable, async (ctx, next, instance) => {
  const value = await next(ctx);
  const child = instance.payload;
  const [def, defRest] = ctx.query.readEntity<TNullableDef>();
  if (value === null) {
    if (def.nullable === false) {
      throw UnexpectedNullable.create();
    }
    return null;
  }
  if (def.nullable === false) {
    return ctx.resolve(child, ctx.withQuery(defRest).withValue(value));
  }
  return ctx.resolve(
    child,
    ctx
      .withQuery(queryReader(def.nullable))
      .withValue(value)
      .withPath([...ctx.path, 'nullable']),
  );
});

const objectResolver = resolver(baseEntity.object, async (ctx, next, instance) => {
  const value = await next(ctx);
  const fields = instance.payload;
  const [key, nextQuery] = ctx.query.readEntity<string>();
  if (key in fields === false) {
    throw InvalidQuery.create();
  }
  return ctx.resolve(
    fields[key],
    ctx
      .withQuery(nextQuery)
      .withPath([...ctx.path, key])
      .withValue(value?.[key]),
  );
});

const listResolver = resolver(baseEntity.list, () => {
  throw new Error('Not implemented');
});

export const InputDataKey = Key.create<any>('InputData');

const inputResolver = resolver(baseEntity.input, async (ctx, next, instance) => {
  const [q] = ctx.query.readEntity<IInputDef>();

  const child = instance.payload;
  const value = await next(ctx.with(InputDataKey.Provider(q.input)));

  return ctx.resolve(
    child,
    ctx
      .withQuery(queryReader(q.select))
      .withPath([...ctx.path, '()'])
      .withValue(value),
  );
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
    result[key] = await next(ctx.withQuery(queryReader(subDef)));
  }
  return result;
});

const errorBoundaryAbstractResolver = abstractResolver(
  abstracts.errorBoundary,
  (ctx, next, data): TAbstractErrorBoundaryResult<any> => {
    try {
      const result = next(ctx.withQuery(queryReader(data)));
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  },
);

export const abstractResolvers = {
  object: objectAbstractResolver,
  errorBoundary: errorBoundaryAbstractResolver,
};

export const defaultResolvers: readonly TResolver[] = [
  ...Object.values(baseResolvers),
  ...Object.values(abstractResolvers),
];
