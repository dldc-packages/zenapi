import type { IKeyProvider, TStaackCoreValue } from '@dldc/stack';
import { Staack } from '@dldc/stack';

export class ZenApiContext extends Staack {
  static create(...keys: IKeyProvider<any, boolean>[]): ZenApiContext {
    return new ZenApiContext().with(...keys);
  }

  protected instantiate(staackCore: TStaackCoreValue): this {
    return new ZenApiContext(staackCore) as any;
  }
}
