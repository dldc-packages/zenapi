import type { ZenTypeAny } from './ZenType.types';
import type { QueryBuilder } from './queryBuilder.types';

export function queryBuilder<Schema extends ZenTypeAny>(schema: Schema): QueryBuilder<Schema> {
  throw new Error('Not implemented');
}
