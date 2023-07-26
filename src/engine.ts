import type { ResolvedType, ZenTypeAny, ZenTypeResolve } from './ZenType.types';
import type { ZenImplementation } from './implem';

export interface Engine {
  run: (query: FormData) => Promise<unknown>; // TODO: return type
}

export function engine(schema: ZenTypeAny, ...implems: ZenImplementation[]): Engine {
  return { run };

  async function run(query: FormData) {}
}

export function resolve<Type extends ZenTypeAny>(type: Type, value: ZenTypeResolve<Type>): ResolvedType {
  return { type, value };
}
