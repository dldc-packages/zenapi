import type { TStackCoreValue } from "@dldc/stack";
import { createKey, createKeyWithDefault, Stack } from "@dldc/stack";
import type { TVariables } from "../client/query.types.ts";
import type { TYPES } from "./constants.ts";
import type { TGraphBaseAny } from "./graph.ts";

const GraphKey = createKey<TGraphBaseAny>("graph");
const ValueKey = createKeyWithDefault<unknown>("value", undefined);
const VariablesKey = createKey<TVariables>("variables");
const InputsKey = createKeyWithDefault<Map<TGraphBaseAny, unknown>>(
  "inputs",
  new Map(),
);

export class ApiContext extends Stack {
  static readonly GraphKey = GraphKey;
  static readonly ValueKey = ValueKey;
  static readonly VariablesKey = VariablesKey;
  static readonly InputsKey = InputsKey;

  static create(graph: TGraphBaseAny, variables: TVariables): ApiContext {
    return new ApiContext().with(
      GraphKey.Provider(graph),
      VariablesKey.Provider(variables),
    );
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    return new ApiContext(stackCore) as any;
  }

  get graph(): TGraphBaseAny {
    return this.getOrFail(GraphKey.Consumer);
  }

  get value(): unknown {
    return this.get(ValueKey.Consumer);
  }

  getInput<G extends TGraphBaseAny>(
    graph: G,
  ): G[typeof TYPES]["base"] | undefined {
    const inputs = this.getOrFail(InputsKey.Consumer);
    return inputs.get(graph);
  }

  getInputOrFail<G extends TGraphBaseAny>(graph: G): G[typeof TYPES]["base"] {
    const inputs = this.getOrFail(InputsKey.Consumer);
    if (!inputs.has(graph)) {
      throw new Error(`Input for graph is not found: ${graph}`);
    }
    return inputs.get(graph);
  }

  withGraph(graph: TGraphBaseAny): this {
    return this.with(GraphKey.Provider(graph));
  }

  withValue(value: unknown): this {
    return this.with(ValueKey.Provider(value));
  }
}
