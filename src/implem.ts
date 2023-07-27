import type { ApiContext } from './context';
import type { IModelResolved } from './engine';
import type { TModelAny } from './model';

const IMPLEM = Symbol('IMPLEM');
type IMPLEM = typeof IMPLEM;

export interface IImplementation {
  readonly [IMPLEM]: true;
}

export function respond(ctx: ApiContext, ...resolved: IModelResolved[]): IImplemFnResponse {
  return { ctx, resolved };
}

export interface IImplemFnResponse {
  ctx: ApiContext;
  resolved: IModelResolved[];
}

export type IImplemFnData<Model extends TModelAny> = {
  ctx: ApiContext;
  input: unknown; // Moded extends IModel<infer Fields, any> ? TFormiFieldTreeValue<Fields> : never;
};

export type IImplemFn<Model extends TModelAny> = (
  data: IImplemFnData<Model>,
) => Promise<IImplemFnResponse> | IImplemFnResponse;

export function implem<Model extends TModelAny>(model: Model, implenFn: IImplemFn<Model>): IImplementation {
  throw new Error('Not implemented');
}
