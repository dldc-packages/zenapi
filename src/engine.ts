import type { IImplementation, TImplemFn } from './implem';
import type { TModelAny, TModelProvided } from './model';
import type { TQueryDef } from './query';

export interface IEngine {
  run: (queryDef: TQueryDef) => Promise<unknown>; // TODO: return type
}

export function engine(schema: TModelAny, ...implems: IImplementation[]): IEngine {
  const implemsByModel = new Map<TModelAny, TImplemFn<TModelAny>>();
  for (const implem of implems) {
    if (implemsByModel.has(implem.model)) {
      throw new Error(`Duplicate implem for model at index ${implems.indexOf(implem)}`);
    }
    implemsByModel.set(implem.model, implem.implemFn);
  }

  return { run };

  async function run(queryDef: TQueryDef) {
    const result = await resolveModel(schema, queryDef);

    console.log('run', queryDef);
    throw new Error('Not implemented');
  }

  async function resolveModel(model: TModelAny, def: TQueryDef) {
    const [current, ...rest] = def;
    const implemFn = implemsByModel.get(model);
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
