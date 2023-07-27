import type { IImplementation } from './implem';
import type { TModelAny, TModelValue } from './model';

export interface IEngine {
  run: (query: FormData) => Promise<unknown>; // TODO: return type
}

export function engine(schema: TModelAny, ...implems: IImplementation[]): IEngine {
  return { run };

  async function run(query: FormData) {}
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
