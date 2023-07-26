import type { TypesRecord, ZenTypeAny } from './ZenType.types';
import type {
  QueryAny,
  QueryBuilderFunc,
  QueryBuilderList,
  QueryBuilderRecord,
  QueryDefAny,
  QueryDefFunc,
  QueryDefProperty,
} from './query.types';
import { PARENT, RESULT, type Query, type QueryBuilder, type QuerySelect, type QuerySelectResult } from './query.types';

export function query<Schema extends ZenTypeAny, Q extends QuerySelect>(
  schema: Schema,
  fn: (sub: QueryBuilder<Schema>) => Q,
): Query<QuerySelectResult<Q>> {
  const select = fn(queryBuilder(schema, null));
  return { def: createQueryDefFromSelect(select), [RESULT]: null as any };
}

function queryBuilder<Type extends ZenTypeAny>(type: Type, parent: QueryDefAny | null): QueryBuilder<Type> {
  if (type.kind === 'record') {
    const res: QueryBuilderRecord<TypesRecord> = {};
    for (const [key, subType] of Object.entries(type.record as TypesRecord)) {
      const subDef: QueryDefProperty = { [PARENT]: parent, kind: 'property', property: key };
      res[key] = queryBuilder(subType, subDef);
    }
    return res as any;
  }
  if (type.kind === 'func') {
    const res: QueryBuilderFunc<any, any> = {
      formData: (data) => {
        const def: QueryDefFunc = { [PARENT]: parent, kind: 'func', input: { type: 'formdata', data } };
        return {
          select: (fn) => {
            const select = fn(queryBuilder(type.result, def));
            return { def: createQueryDefFromSelect(select), [RESULT]: null as any };
          },
        };
      },
      json: (data) => {
        const def: QueryDefFunc = { [PARENT]: parent, kind: 'func', input: { type: 'json', data } };
        return {
          select: (fn) => {
            const select = fn(queryBuilder(type.result, def));
            return { def: createQueryDefFromSelect(select), [RESULT]: null as any };
          },
        };
      },
    };
    return res as any;
  }
  if (type.kind === 'list') {
    const res: QueryBuilderList<any> = {
      all: (fn) => {
        throw new Error('Not implemented');
      },
      first: (fn) => {
        throw new Error('Not implemented');
      },
      paginate: (page, fn) => {
        throw new Error('Not implemented');
      },
    };
    return res as any;
  }
  if (type.kind === 'nil') {
    const query: Query<null> = { def: parent, [RESULT]: {} as any };
    return query as any;
  }
  if (type.kind === 'boolean' || type.kind === 'number' || type.kind === 'string') {
    const query: Query<Type> = { def: parent, [RESULT]: {} as any };
    return query as any;
  }
  throw new Error(`Unsupported type: ${type.kind}`);
}

function createQueryDefFromSelect(select: QuerySelect): QueryDefAny {
  if (isQuery(select)) {
    return select.def;
  }
  return { [PARENT]: null, kind: 'select', select };
}

function isQuery(select: QuerySelect): select is QueryAny {
  return select && typeof select === 'object' && RESULT in select;
}
