import type { TFormiFieldTreeValue } from '@dldc/formi';
import type { ZenApiContext } from './ZenApiContext';
import type { ResolvedType, ZenTypeAny, ZenTypeFunc } from './ZenType.types';

const IMPLEM = Symbol('IMPLEM');
type IMPLEM = typeof IMPLEM;

export interface ZenImplementation {
  readonly [IMPLEM]: true;
}

export function respond(ctx: ZenApiContext, ...resolved: ResolvedType[]): ImplemFnResponse {
  return { ctx, resolved };
}

export interface ImplemFnResponse {
  ctx: ZenApiContext;
  resolved: ResolvedType[];
}

export type ImplemFnData<Type extends ZenTypeAny> = {
  ctx: ZenApiContext;
  input: Type extends ZenTypeFunc<infer Fields, any> ? TFormiFieldTreeValue<Fields> : never;
};

export type ImplemFn<Type extends ZenTypeAny> = (
  data: ImplemFnData<Type>,
) => Promise<ImplemFnResponse> | ImplemFnResponse;

export function implem<Type extends ZenTypeAny>(type: Type, implenFn: ImplemFn<Type>): ZenImplementation {
  throw new Error('Not implemented');
}
