import type { IKeyProvider, TStaackCoreValue } from '@dldc/stack';
import { Staack } from '@dldc/stack';

export class ApiContext extends Staack {
  static create(...keys: IKeyProvider<any, boolean>[]): ApiContext {
    return new ApiContext().with(...keys);
  }

  protected instantiate(staackCore: TStaackCoreValue): this {
    return new ApiContext(staackCore) as any;
  }
}
