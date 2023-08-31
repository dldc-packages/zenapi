import { Key } from '@dldc/stack';
import { InvalidQuery, InvalidResolvedValue, UnexpectedNullable, UnresolvedValue } from '../erreur';
import { queryReader } from '../query';
import { abstractResolver, typeResolver } from '../types';
import type { IInputDef, TNullableDef } from './type';
import { abstracts, types } from './type';

const stringResolver = typeResolver(types.string, async (ctx, entity) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (typeof value !== 'string') {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const dateResolver = typeResolver(types.date, async (ctx, entity) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (!(value instanceof Date)) {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const numberResolver = typeResolver(types.number, async (ctx, entity) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (typeof value !== 'number') {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const booleanResolver = typeResolver(types.boolean, async (ctx, entity) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (typeof value !== 'boolean') {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const jsonResolver = typeResolver(types.json, async (ctx, entity) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  return value;
});

const nilResolver = typeResolver(types.nil, async (ctx, entity) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (value !== null) {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const enumResolver = typeResolver(types.enum, async (ctx, entity, data) => {
  const value = await ctx.resolve(entity, ctx, true);
  if (value === undefined) {
    throw UnresolvedValue.create();
  }
  if (!data.includes(value)) {
    throw InvalidResolvedValue.create();
  }
  return value;
});

const nullableResolver = typeResolver(types.nullable, async (ctx, entity, data) => {
  const value = await ctx.resolve(entity, ctx, true);
  const [def, defRest] = ctx.query.readEntity<TNullableDef>();
  if (value === null) {
    if (def.nullable === false) {
      throw UnexpectedNullable.create();
    }
    return null;
  }
  if (def.nullable === false) {
    return ctx.resolve(data, ctx.withQuery(defRest).withValue(value));
  }
  return ctx.resolve(
    data,
    ctx
      .withQuery(queryReader(def.nullable))
      .withValue(value)
      .withPath([...ctx.path, 'nullable']),
  );
});

const objectResolver = typeResolver(types.object, async (ctx, entity, fields) => {
  const value = await ctx.resolve(entity, ctx, true);
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

const listResolver = typeResolver(types.list, () => {
  throw new Error('Not implemented');
});

export const InputDataKey = Key.create<any>('InputData');

const inputResolver = typeResolver(types.input, async (ctx, entity, data) => {
  const [q] = ctx.query.readEntity<IInputDef>();

  const value = await ctx.resolve(entity, ctx.with(InputDataKey.Provider(q.input)), true);

  return ctx.resolve(
    data,
    ctx
      .withQuery(queryReader(q.select))
      .withPath([...ctx.path, 'select'])
      .withValue(value),
  );
});

export const typeResolvers = {
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

const objectAbstractResolver = abstractResolver(abstracts.object, async ({ resolve, ctx, data, entity }) => {
  const result: Record<string, any> = {};
  for (const [key, subDef] of Object.entries(data)) {
    result[key] = await resolve(entity, ctx.withQuery(queryReader(subDef)));
  }
  return result;
});

const errorBoundaryAbstractResolver = abstractResolver(abstracts.errorBoundary, ({ ctx, resolve, data, entity }) => {
  try {
    const result = resolve(entity, ctx.withQuery(queryReader(data)));
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
});

export const abstractResolvers = {
  object: objectAbstractResolver,
  errorBoundary: errorBoundaryAbstractResolver,
};
