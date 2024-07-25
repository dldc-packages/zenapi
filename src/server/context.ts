import type { TKey, TStackCoreValue } from "@dldc/stack";
import { createKey, createKeyWithDefault, Stack } from "@dldc/stack";
import type { TVariables } from "../client/query.types.ts";
import { GET, REF, STRUCTURE, type TYPES } from "./constants.ts";
import { graphMatch, type TGraphBaseAny } from "./graph.ts";

export interface TInputItem {
  path: TGraphBaseAny;
  inputs: unknown[];
}

const GraphKey: TKey<TGraphBaseAny, false> = createKey("graph");
const ValueKey: TKey<unknown, true> = createKeyWithDefault<unknown>(
  "value",
  undefined,
);
const VariablesKey: TKey<TVariables, false> = createKey("variables");
const InputsKey: TKey<TInputItem[], true> = createKeyWithDefault(
  "inputs",
  [] as TInputItem[],
);
const ValueTypeKey: TKey<TGraphBaseAny | null, false> = createKey("valueType");

export class ApiContext extends Stack {
  static readonly GraphKey = GraphKey;
  static readonly ValueKey = ValueKey;
  static readonly VariablesKey = VariablesKey;
  static readonly InputsKey = InputsKey;
  static readonly ValueTypeKey = ValueTypeKey;

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

  private getInputInternal(
    graph: TGraphBaseAny,
  ): TInputItem | undefined {
    const inputs = this.getOrFail(InputsKey.Consumer);
    const target = resolveInputTarget(graph);
    const found = inputs.find((input) => graphMatch(input.path, target));
    return found;
  }

  getInput<G extends TGraphBaseAny>(
    graph: G,
  ): G[typeof TYPES]["input"] | undefined {
    const found = this.getInputInternal(graph);
    return found?.inputs;
  }

  getInputOrFail<G extends TGraphBaseAny>(
    graph: G,
  ): G[typeof TYPES]["input"] {
    const found = this.getInputInternal(graph);
    if (!found) {
      throw new Error(`Input for graph is not found: ${graph}`);
    }
    return found.inputs;
  }

  withGraph(graph: TGraphBaseAny): this {
    return this.with(GraphKey.Provider(graph));
  }

  withValue(value: unknown): this {
    return this.with(ValueKey.Provider(value));
  }

  withValueType(graph: TGraphBaseAny | null): this {
    return this.with(ValueTypeKey.Provider(graph));
  }
}

function resolveInputTarget(graph: TGraphBaseAny): TGraphBaseAny {
  const struct = graph[STRUCTURE];
  if (struct.kind === "alias") {
    return graph[GET](REF);
  }
  return graph;
}
