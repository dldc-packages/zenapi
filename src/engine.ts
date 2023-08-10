import { isAbstractQueryDef, type TAbstractAny } from './abstract';
import { abstracts as baseAbstracts } from './base/abstracts';
import { ApiContext } from './context';
import { CouldNotResolve, DuplicateImplem, UnexpectedArrayInQueryDef, UnknownAbstract } from './erreur';
import type { IImplementation, TImplemFn } from './implem';
import { extractImpleResult, withCtx } from './implem';
import type { TModelAny, TModelValue, TPath } from './model';
import type { TQueryAny, TQueryDefModel, TQueryResult } from './query';
import { type TQueryDef } from './query';

export interface IEngine {
  run: <Q extends TQueryAny>(query: Q) => Promise<TQueryResult<Q>>;
}

export interface IEngineOptions {
  schema: TModelAny;
  implems: IImplementation[];
  abstracts?: TAbstractAny[];
}

export function engine({ implems, schema, abstracts = baseAbstracts }: IEngineOptions): IEngine {
  const implemsByModel = new Map<TModelAny, TImplemFn<TModelAny>>();
  for (const implem of implems) {
    if (implemsByModel.has(implem.model)) {
      throw DuplicateImplem.create(implems.indexOf(implem));
    }
    implemsByModel.set(implem.model, implem.implemFn);
  }

  return { run };

  async function run(query: TQueryAny) {
    const ctx = ApiContext.create();
    return await resolveInternal(ctx, schema, [], query.def, undefined);
  }

  async function resolveInternal(
    ctx: ApiContext,
    model: TModelAny,
    path: TPath,
    def: TQueryDef,
    value: any,
  ): Promise<any> {
    const [current, ...defRest] = def;
    if (isAbstractQueryDef(current)) {
      const [name, def] = current;
      const abstract = abstracts.find((ab) => ab.name === name);
      if (!abstract) {
        throw UnknownAbstract.create(name);
      }
      return abstract.resolve({ path, ctx, def, defRest, model, resolve: resolveInternal, value });
    }
    if (Array.isArray(current)) {
      throw UnexpectedArrayInQueryDef.create();
    }
    const [nextCtx, valueResolved] = await resolveValue(ctx, value, model, current);
    if (!model.resolve) {
      throw CouldNotResolve.create(path);
    }
    return model.resolve({
      path,
      ctx: nextCtx,
      def: current,
      defRest,
      resolve: resolveInternal,
      value: valueResolved,
    });
  }

  async function resolveValue(
    ctx: ApiContext,
    value: any,
    model: TModelAny,
    def: TQueryDefModel,
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

export function resolve<Model extends TModelAny>(model: Model, value: TModelValue<Model>): IModelResolved {
  return { [RESOLVED]: true, model, value };
}
