import type { ApiContext } from './context';
import type { TModelAny, TModelDef, TModelProvided } from './model';

const IMPLEM = Symbol('IMPLEM');
type IMPLEM = typeof IMPLEM;

export interface IImplementation {
  readonly [IMPLEM]: true;
  readonly model: TModelAny;
  readonly implemFn: TImplemFn<TModelAny>;
}

interface IProvidedWithCtx<Value> {
  readonly [IMPLEM]: true;
  readonly provided: Value;
  readonly ctx: ApiContext;
}

export function withCtx<Value>(ctx: ApiContext, value: Value): IProvidedWithCtx<Value> {
  return {
    [IMPLEM]: true,
    provided: value,
    ctx,
  };
}

export type TImplemFnResponse<Model extends TModelAny> = IProvidedWithCtx<Model> | TModelProvided<Model>;

export interface IImplemFnData<Model extends TModelAny> {
  ctx: ApiContext;
  def: TModelDef<Model>;
  withCtx: (ctx: ApiContext, value: TModelProvided<Model>) => IProvidedWithCtx<TModelProvided<Model>>;
}

export type TImplemFn<Model extends TModelAny> = (
  data: IImplemFnData<Model>,
) => Promise<TImplemFnResponse<Model>> | TImplemFnResponse<Model>;

export function implem<Model extends TModelAny>(model: Model, implenFn: TImplemFn<Model>): IImplementation {
  return { [IMPLEM]: true, model, implemFn: implenFn as any };
}

export function extractImpleResult(ctx: ApiContext, result: any): [nextCtx: ApiContext, value: any] {
  if (result && typeof result === 'object' && IMPLEM in result) {
    return [result.ctx, result.provided];
  }
  return [ctx, result];
}
