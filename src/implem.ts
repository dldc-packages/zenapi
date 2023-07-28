import type { ApiContext } from './context';
import type { IModelResolved } from './engine';
import type { TModelAny } from './model';

const IMPLEM = Symbol('IMPLEM');
type IMPLEM = typeof IMPLEM;

export interface IImplementation {
  readonly [IMPLEM]: true;
  readonly model: TModelAny;
  readonly implemFn: TImplemFn<TModelAny>;
}

export function respond(ctx: ApiContext, ...resolved: IModelResolved[]): IImplemFnResponse {
  return { ctx, resolved };
}

export interface IImplemFnResponse {
  ctx: ApiContext;
  resolved: IModelResolved[];
}

export interface IImplemFnData<Model extends TModelAny> {
  ctx: ApiContext;
  input: unknown; // Moded extends IModel<infer Fields, any> ? TFormiFieldTreeValue<Fields> : never;
}

export type TImplemFn<Model extends TModelAny> = (
  data: IImplemFnData<Model>,
) => Promise<IImplemFnResponse> | IImplemFnResponse;

export function implem<Model extends TModelAny>(model: Model, implenFn: TImplemFn<Model>): IImplementation {
  return { [IMPLEM]: true, model, implemFn: implenFn };
}
