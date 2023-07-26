import type { ZenTypeAny } from './ZenType.types';
import type { ZenImplementation } from './implem';

export function createResolver(schema: ZenTypeAny, ...implems: ZenImplementation[]) {
  throw new Error('Not implemented');
}
