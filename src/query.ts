import type { TInstanceAny } from './entity';
import { resolveBuilder, type TQueryBuilder } from './entity';
import { UnexpectedReadNextInEmptyQuery, UnexpectedReadNextType } from './erreur';

export const RESULT = Symbol('RESULT');
export type RESULT = typeof RESULT;

// No array as they are reserved for query only (like object)
export type TQueryItemEntity = Record<string, any> | string | number | boolean | null | undefined;

export type TQueryItemAbstract<Data> = readonly [string, Data];

export type TQueryItem = TQueryItemAbstract<any> | TQueryItemEntity;

export type TQuery = readonly TQueryItem[];

export type TTypedQueryAny = ITypedQuery<any>;

export interface ITypedQuery<Result> {
  readonly [RESULT]: Result;
  readonly query: TQuery;
}

export type TTypedQueryResult<Q extends TTypedQueryAny> = Q[RESULT];

export function createQuery<Result>(q: TQuery): ITypedQuery<Result> {
  return { query: q, [RESULT]: null as any };
}

export function query<Schema extends TInstanceAny>(schema: Schema): TQueryBuilder<Schema> {
  return resolveBuilder(schema, []);
}

export interface IQueryReader {
  maybeReadAbstract(): [TQueryItemAbstract<any> | undefined, IQueryReader];
  readEntity<Query extends TQueryItemEntity>(): [Query, IQueryReader];
}

export function queryReader(query: TQuery): IQueryReader {
  const reader: IQueryReader = {
    maybeReadAbstract() {
      if (query.length === 0) {
        return [undefined, reader];
      }
      const [item, next] = readNext();
      if (!isAbstract(item)) {
        return [undefined, reader];
      }
      return [item, next];
    },
    readEntity<Query extends TQueryItemEntity>() {
      const [item, next] = readNext();
      if (isAbstract(item)) {
        throw UnexpectedReadNextType.create();
      }
      return [item as Query, next];
    },
  };

  return reader;

  function isAbstract(item: TQueryItem): item is TQueryItemAbstract<any> {
    return Array.isArray(item) && item.length === 2 && typeof item[0] === 'string';
  }

  function readNext(): [TQueryItem, IQueryReader] {
    if (query.length === 0) {
      throw UnexpectedReadNextInEmptyQuery.create();
    }
    const [item, ...rest] = query;
    return [item, queryReader(rest)];
  }
}
