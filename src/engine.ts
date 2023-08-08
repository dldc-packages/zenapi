import { isAbstractQueryDef, type TAbstractAny } from './abstract';
import { abstracts as baseAbstracts } from './base/abstracts';
import { ApiContext } from './context';
import type { IImplementation, TImplemFn } from './implem';
import { extractImpleResult, withCtx } from './implem';
import type { TModelAny, TModelProvided } from './model';
import type { TModelQueryDef } from './query';
import { type TQueryDef } from './query';

export interface IEngine {
  run: (queryDef: TQueryDef) => Promise<unknown>; // TODO: return type
}

export interface IEngineOptions {
  schema: TModelAny;
  implems: IImplementation[];
  abstracts?: TAbstractAny[];
}

const DEFAULT_ABSTRACTS = [baseAbstracts.object];

export function engine({ implems, schema, abstracts = DEFAULT_ABSTRACTS }: IEngineOptions): IEngine {
  const implemsByModel = new Map<TModelAny, TImplemFn<TModelAny>>();
  for (const implem of implems) {
    if (implemsByModel.has(implem.model)) {
      throw new Error(`Duplicate implem for model at index ${implems.indexOf(implem)}`);
    }
    implemsByModel.set(implem.model, implem.implemFn);
  }

  return { run };

  async function run(queryDef: TQueryDef) {
    const ctx = ApiContext.create();
    return await resolveInternal(ctx, schema, queryDef, undefined);
  }

  async function resolveInternal(ctx: ApiContext, model: TModelAny, def: TQueryDef, value: any): Promise<any> {
    const [current, ...defRest] = def;
    if (isAbstractQueryDef(current)) {
      const [name, def] = current;
      const abstract = abstracts.find((ab) => ab.name === name);
      if (!abstract) {
        throw new Error(`Could not resolve abstract ${name}`);
      }
      return abstract.resolve({ ctx, def, defRest, model, resolve: resolveInternal, value });
    }
    if (Array.isArray(current)) {
      throw new Error('Unexpected array in query def');
    }
    const [nextCtx, valueResolved] = await resolveValue(ctx, value, model, current);
    if (!model.resolve) {
      throw new Error(`Could not resolve`);
    }
    return model.resolve({ ctx: nextCtx, def: current, defRest, resolve: resolveInternal, value: valueResolved });
  }

  async function resolveValue(
    ctx: ApiContext,
    value: any,
    model: TModelAny,
    def: TModelQueryDef,
  ): Promise<[ApiContext, any]> {
    if (value !== undefined) {
      return [ctx, value];
    }
    const implemFn = implemsByModel.get(model);
    if (!implemFn) {
      return [ctx, undefined];
    }
    return extractImpleResult(ctx, await implemFn({ ctx, def, withCtx }));
  }
}

export const RESOLVED = Symbol('RESOLVED');
export type RESOLVED = typeof RESOLVED;

export interface IModelResolved {
  readonly [RESOLVED]: true;
  model: TModelAny;
  value: any;
}

export function resolve<Model extends TModelAny>(model: Model, value: TModelProvided<Model>): IModelResolved {
  return { [RESOLVED]: true, model, value };
}
