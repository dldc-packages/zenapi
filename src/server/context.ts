import type { TStackCoreValue } from "@dldc/stack";
import { createKey, createKeyWithDefault, Stack } from "@dldc/stack";
import type { TGraphBase } from "./graph.ts";

const GraphKey = createKey<TGraphBase>("graph");
const ValueKey = createKeyWithDefault<unknown>("value", undefined);

export class ApiContext extends Stack {
  static readonly GraphKey = GraphKey;
  static readonly ValueKey = ValueKey;

  static create(graph: TGraphBase): ApiContext {
    return new ApiContext().with(GraphKey.Provider(graph));
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    return new ApiContext(stackCore) as any;
  }

  get graph(): TGraphBase {
    return this.getOrFail(GraphKey.Consumer);
  }

  get value(): unknown {
    return this.get(ValueKey.Consumer);
  }

  // withGraph(graph: TGraphBase): this {
  //   return this.with(GraphKey.Provider(graph));
  // }

  withValue(value: unknown): this {
    return this.with(ValueKey.Provider(value));
  }
}
