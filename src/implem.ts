import type { ApiContext } from './context';
import type { TModelAny, TModelDef, TModelValue } from './model';

const IMPLEM = Symbol('IMPLEM');
type IMPLEM = typeof IMPLEM;

export interface IImplementation {
  readonly [IMPLEM]: true;
  readonly model: TModelAny;
  readonly implemFn: TImplemFn<TModelAny>;
}

interface IValueWithCtx<Value> {
  readonly [IMPLEM]: true;
  readonly value: Value;
  readonly ctx: ApiContext;
}

export function withCtx<Value>(ctx: ApiContext, value: Value): IValueWithCtx<Value> {
  return {
    [IMPLEM]: true,
    value: value,
    ctx,
  };
}

export type TImplemFnResponse<Model extends TModelAny> = IValueWithCtx<Model> | TModelValue<Model>;

export interface IImplemParams<Model extends TModelAny> {
  ctx: ApiContext;
  def: TModelDef<Model>;
  withCtx: TWithCtx<Model>;
}

export type TWithCtx<Model extends TModelAny> = (
  ctx: ApiContext,
  value: TModelValue<Model>,
) => IValueWithCtx<TModelValue<Model>>;

export type TImplemFn<Model extends TModelAny> = (
  data: IImplemParams<Model>,
) => Promise<TImplemFnResponse<Model>> | TImplemFnResponse<Model>;

export function implem<Model extends TModelAny>(model: Model, implenFn: TImplemFn<Model>): IImplementation {
  return { [IMPLEM]: true, model, implemFn: implenFn as any };
}

export function extractImpleResult(ctx: ApiContext, result: any): [nextCtx: ApiContext, value: any] {
  if (result && typeof result === 'object' && IMPLEM in result) {
    const resWithCtx = result as IValueWithCtx<any>;
    return [resWithCtx.ctx, resWithCtx.value];
  }
  return [ctx, result];
}
